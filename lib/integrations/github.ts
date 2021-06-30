/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

import * as assert from '@balena/jellyfish-assert';
import { Integration } from '@balena/jellyfish-plugin-base';
import type { EventContract } from '@balena/jellyfish-types/build/core';
import { createAppAuth } from '@octokit/auth-app';
import { retry } from '@octokit/plugin-retry';
import { throttling } from '@octokit/plugin-throttling';
import { Octokit as OctokitRest } from '@octokit/rest';
import type { Octokit as OctokitInstance } from '@octokit/rest';
import Bluebird from 'bluebird';
import crypto from 'crypto';
import _, { create } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import YAML from 'yaml';
import * as utils from './utils';

// tslint:disable-next-line: no-var-requires
const packageJSON = require('../../package.json');

// const octokit = Octokit.plugin(retry, throttling);
const GITHUB_API_REQUEST_LOG_TITLE = 'GitHub API Request';
const GITHUB_API_RETRY_COUNT = 5;
const SLUG = 'github';
const Octokit = OctokitRest.plugin(retry, throttling);

// Matches the prefix used when posting to GitHub on behalf of a user
const PREFIX_RE = /^\[.*\] /;

const withoutPrefix = (body) => {
	return body.replace(PREFIX_RE, '');
};

async function githubRequest(
	fn: any,
	arg: any,
	options?: any,
	retries = 5,
): Promise<any> {
	const result = await fn(arg);

	if (result.status >= 500) {
		assert.USER(
			null,
			retries > 0,
			options.errors.SyncExternalRequestError,
			() => {
				return `GitHub unavailable ${result.status}: ${JSON.stringify(
					result.data,
					null,
					2,
				)}`;
			},
		);

		options.context.log.warn('GitHub unavailable retry', {
			retries,
		});

		await Bluebird.delay(5000);
		return githubRequest(fn, arg, options, retries - 1);
	}

	return result;
}

function getEventRoot(event: EventContract): any {
	if (event.data.payload) {
		return event.data.payload.issue || event.data.payload.pull_request;
	}
}

function getEventMirrorId(event: EventContract): string {
	return getEventRoot(event).html_url;
}

function getCommentMirrorIdFromEvent(event: any): string {
	return event.data.payload.comment.html_url;
}

function revertEventChanges(event: any, object: any): any {
	const previousEvent = _.cloneDeep(event);
	_.each(event.data.payload.changes, (value, key) => {
		previousEvent.data.payload[object][key] = value.from;
	});

	Reflect.deleteProperty(previousEvent.data.payload, 'changes');
	return previousEvent;
}

function updateCardFromSequence(sequence: any, index: any, changes: any): any {
	const card = _.cloneDeep(sequence[index].card);
	_.merge(card, changes);
	card.id = {
		$eval: `cards[${index}].id`,
	};

	return card;
}

function gatherPRInfo(payload: any): any {
	const base = payload.pull_request.base;
	const head = payload.pull_request.head;
	return {
		base: {
			branch: base.ref,
			sha: base.sha,
		},
		head: {
			branch: head.ref,
			sha: head.sha,
		},
	};
}

function normaliseRootID(id: string): string {
	return id.replace(/[=]/g, '').toLowerCase();
}

function eventToCardType(event: any): any {
	return event.data.payload.pull_request ||
		(event.data.payload.issue && event.data.payload.issue.pull_request)
		? 'pull-request@1.0.0'
		: 'issue@1.0.0';
}

function makeCard(card: any, actor: string, time?: string): any {
	let date = new Date();
	if (time) {
		date = new Date(time);
	}

	return {
		time: date,
		card,
		actor,
	};
}

async function getCommentFromEvent(
	_context: any,
	event: any,
	options: any,
): Promise<any> {
	const date = new Date(event.data.payload.comment.updated_at);

	const data = {
		mirrors: [getCommentMirrorIdFromEvent(event)],
		actor: options.actor,
		target: options.target,
		timestamp: date.toISOString(),
		payload: {
			mentionsUser: [],
			alertsUser: [],
			mentionsGroup: [],
			alertsGroup: [],
			message: event.data.payload.comment.body,
		},
	};

	const id = uuidv4();
	const slug = `message-${id}`;

	return [
		makeCard(
			{
				slug,
				type: 'message@1.0.0',
				active: options.active,
				data,
			},
			options.actor,
			options.time,
		),
		makeCard(
			{
				slug: `link-${slug}-is-attached-to-${options.targetCard.slug}`,
				type: 'link@1.0.0',
				name: 'is attached to',
				data: {
					inverseName: 'has attached element',
					from: {
						id: {
							$eval: `cards[${options.offset}].id`,
						},
						type: 'message@1.0.0',
					},
					to: {
						id: options.target,
						type: options.targetCard.type,
					},
				},
			},
			options.actor,
			options.time,
		),
	];
}

module.exports = class GitHubIntegration implements Integration {
	public slug = SLUG;

	// TS-TODO: Use proper types
	public context: any;
	public options: any;

	constructor(options: any) {
		this.options = options;
		this.context = this.options.context;
	}

	async initialize() {
		return Bluebird.resolve();
	}

	async destroy() {
		return Bluebird.resolve();
	}

	async getOctokit(
		context: any,
		installationId?: number,
	): Promise<OctokitInstance | null> {
		const octokitOptions: any = {
			request: {
				retries: GITHUB_API_RETRY_COUNT,
			},
			userAgent: `${packageJSON.name} v${packageJSON.version}`,
			throttle: {
				onRateLimit: (_retryAfter: any, retryOptions: any) => {
					return retryOptions.request.retryCount <= GITHUB_API_RETRY_COUNT;
				},
				onAbuseLimit: (_retryAfter: any, retryOptions: any) => {
					return retryOptions.request.retryCount <= GITHUB_API_RETRY_COUNT;
				},
			},
		};

		if (installationId && this.options.token.key && this.options.token.appId) {
			context.log.info('Using GitHub App based authentication');
			octokitOptions.authStrategy = createAppAuth;
			octokitOptions.auth = {
				appId: _.parseInt(this.options.token.appId),
				privateKey: Buffer.from(this.options.token.key, 'base64').toString(),
			};

			const github = new Octokit(octokitOptions);
			const { token } = (await github.auth({
				type: 'installation',
				installationId,
			})) as any;

			Reflect.deleteProperty(octokitOptions, 'authStrategy');
			octokitOptions.auth = token;
			return new Octokit(octokitOptions);
		}

		if (this.options.token.api) {
			context.log.info('Using token based authentication');
			octokitOptions.auth = this.options.token.api;
			return new Octokit(octokitOptions);
		}

		return null;
	}

	async mirror(card: any, options: any) {
		if (!this.options.token.api) {
			this.context.log.warn('No token set for github integration');
			return [];
		}

		if (!this.options.token.key) {
			this.context.log.warn('No private key set for github integration');
			return [];
		}

		const github: any = await this.getOctokit(this.context);
		if (!github) {
			this.context.log.warn('Could not authenticate with GitHub');
			return [];
		}

		const githubUrl = _.find(card.data.mirrors, (mirror) => {
			return _.startsWith(mirror, 'https://github.com');
		});

		this.context.log.info('Mirroring GitHub', {
			url: githubUrl,
			remote: card,
		});

		const actorCard = await this.context.getElementById(options.actor);
		const username = _.get(actorCard, ['slug'], 'unknown').replace(
			/^user-/,
			'',
		);
		const prefix = `[${username}]`;
		const baseType = card.type.split('@')[0];

		if (baseType === 'commit') {
			const newCard = makeCard(
				{
					name: `Check-Run ${card.head_sha}`,
					type: 'check-run@1.0.0',
					slug: `check-run-${card.head_sha}`,
					data: {
						owner: card.org,
						repo: `${card.org}/${card.repo}`,
						head_sha: card.head_sha,
						details_url: '',
						started_at: new Date().toISOString(),
						check_run_id: uuidv4(),
					},
				},
				options.actor,
			);

			makeCard(
				{
					slug: `link-commit-check-run-${card.data.head_sha}-${newCard.id}`,
					type: 'link@1.0.0',
					name: 'is attached to commit',
					data: {
						inverseName: 'has attached check run',
						from: {
							id: newCard.id,
							type: newCard.type,
						},
						to: {
							id: card.data.id,
							type: card.data.type,
						},
					},
				},
				options.actor,
			);
		}

		if (baseType === 'check-run') {
			switch (card.data.status) {
				case 'queued': {
					const uid = `jellyfish_${uuidv4()}`;

					// Create check run, store id from github back in card
					const results = await githubRequest(github.checks.create, {
						owner: card.data.owner,
						repo: card.data.repository,
						name: card.name,
						head_sha: card.data.head_sha,
						status: card.data.status,
						started_at: card.data.started_at,
						details_url: card.data.details_url,
						external_id: uid,
					});
					card.data.check_run_id = results.check_run_id;

					// Update card for idempotency in the webhook
					card.slug = `check-run-${uid}`;
					return [makeCard(card, options.actor)];
				}

				case 'in_progress': {
					// Update check run
					await githubRequest(github.checks.update, {
						owner: card.data.owner,
						repo: card.data.repository,
						check_run_id: card.data.check_run_id,
						status: card.data.status,
						details_url: card.data.details_url,
						external_id: card.name,
					});
					break;
				}

				case 'completed': {
					// Update check run
					await githubRequest(github.checks.update, {
						owner: card.data.owner,
						repo: card.data.repository,
						check_run_id: card.data.check_run_id,
						status: card.data.status,
						details_url: card.data.details_url,
						completed_at: card.data.completed_at,
						conclusion: card.data.conclusion,
						external_id: card.name,
					});
					break;
				}

				default:
					break;
			}
		}

		if (
			(baseType === 'issue' || baseType === 'pull-request') &&
			card.data.repository
		) {
			const [owner, repository] = card.data.repository.split('/');

			if (!githubUrl) {
				this.context.log.debug(GITHUB_API_REQUEST_LOG_TITLE, {
					category: 'issues',
					action: 'create',
				});

				const githubResult = await githubRequest(
					github.issues.create,
					{
						owner,
						repo: repository,
						title: card.name,
						body: `${prefix} ${card.data.description}`,
						labels: card.tags,
					},
					this.options,
				);

				card.data.mirrors = card.data.mirrors || [];
				card.data.mirrors.push(githubResult.data.html_url);

				return [makeCard(card, options.actor)];
			}

			this.context.log.debug(GITHUB_API_REQUEST_LOG_TITLE, {
				category: baseType === 'pull-request' ? 'pulls' : 'issues',
				action: 'get',
			});

			const urlFragments = githubUrl.split('/');
			const entityNumber = _.parseInt(_.last(urlFragments) || '');

			assert.INTERNAL(
				null,
				_.isNumber(entityNumber) && !_.isNaN(entityNumber),
				this.options.errors.SyncInvalidEvent,
				`No entity number in GitHub URL: ${githubUrl}`,
			);

			const getOptions = {
				owner: urlFragments[3],
				repo: urlFragments[4],
				[baseType === 'pull-request' ? 'pull_number' : 'issue_number']:
					entityNumber,
			};
			const result =
				baseType === 'pull-request'
					? await githubRequest(github.pulls.get, getOptions, this.options)
					: await githubRequest(github.issues.get, getOptions, this.options);

			if (
				result.data.state !== card.data.status ||
				withoutPrefix(result.data.body) !==
					withoutPrefix(card.data.description) ||
				result.data.title !== card.name ||
				!_.isEqual(_.map(result.data.labels, 'name'), card.tags)
			) {
				const prefixMatch = result.data.body.match(PREFIX_RE);
				const body = prefixMatch
					? `${prefixMatch[0]}${card.data.description}`
					: card.data.description;
				const updateOptions = {
					owner: getOptions.owner,
					repo: getOptions.repo,
					issue_number: _.parseInt(_.last(githubUrl.split('/')) || ''),
					title: card.name,
					body,
					state: card.data.status,
					labels: card.tags,
				};

				if (baseType === 'issue') {
					this.context.log.debug(GITHUB_API_REQUEST_LOG_TITLE, {
						category: 'issues',
						action: 'update',
					});

					await githubRequest(
						github.issues.update,
						updateOptions,
						this.options,
					);
				}

				if (baseType === 'pull-request') {
					this.context.log.debug(GITHUB_API_REQUEST_LOG_TITLE, {
						category: 'pulls',
						action: 'update',
					});

					await githubRequest(github.pulls.update, updateOptions, this.options);
				}
			}

			return [];
		}

		if (baseType === 'message') {
			const issue = await this.context.getElementById(card.data.target);
			const issueBaseType = issue.type.split('@')[0];
			if (
				!issue ||
				(issueBaseType !== 'issue' && issueBaseType !== 'pull-request')
			) {
				return [];
			}

			if (!issue.data.repository) {
				return [];
			}

			const issueGithubUrl = _.find(issue.data.mirrors, (mirror) => {
				return _.startsWith(mirror, 'https://github.com');
			});

			const repoDetails = issueGithubUrl
				? {
						owner: issueGithubUrl.split('/')[3],
						repository: issueGithubUrl.split('/')[4],
				  }
				: {
						owner: _.first(issue.data.repository.split('/')),
						repository: _.last(issue.data.repository.split('/')),
				  };

			if (!githubUrl) {
				this.context.log.debug(GITHUB_API_REQUEST_LOG_TITLE, {
					category: 'issues',
					action: 'createComment',
				});

				const result = await githubRequest(
					github.issues.createComment,
					{
						owner: repoDetails.owner,
						repo: repoDetails.repository,
						issue_number: _.parseInt(
							_.last((issueGithubUrl || issue.data.repository).split('/')) ||
								'',
						),
						body: `${prefix} ${card.data.payload.message}`,
					},
					this.options,
				);

				card.data.mirrors = card.data.mirrors || [];
				card.data.mirrors.push(result.data.html_url);

				return [makeCard(card, options.actor)];
			}

			this.context.log.debug(GITHUB_API_REQUEST_LOG_TITLE, {
				category: 'issues',
				action: 'getComment',
			});

			try {
				const result = await githubRequest(
					github.issues.getComment,
					{
						owner: repoDetails.owner,
						repo: repoDetails.repository,
						comment_id: _.parseInt(_.last(githubUrl.split('-')) || ''),
					},
					this.options,
				);

				if (result.data.body !== `${prefix} ${card.data.payload.message}`) {
					this.context.log.debug(GITHUB_API_REQUEST_LOG_TITLE, {
						category: 'issues',
						action: 'updateComment',
					});

					await githubRequest(
						github.issues.updateComment,
						{
							owner: repoDetails.owner,
							repo: repoDetails.repository,
							comment_id: result.data.id,
							body: card.data.payload.message,
						},
						this.options,
					);
				}
			} catch (error) {
				if (error.name === 'HttpError' && error.status === 404) {
					return [
						makeCard(
							Object.assign({}, card, {
								active: false,
							}),
							options.actor,
						),
					];
				}

				throw error;
			}

			return [];
		}

		return [];
	}

	async getRepoCard(repo: any, options: any): Promise<any> {
		const mirrorID = repo.html_url;
		const existingCard = await this.getCardByMirrorId(
			mirrorID,
			'repository@1.0.0',
		);

		if (existingCard) {
			return {
				repoInfo: {
					slug: existingCard.slug,
					target: {
						id: existingCard.id,
						type: 'repository@1.0.0',
					},
				},
				card: null,
			};
		}
		const owner = repo.owner.login;
		const name = repo.name;
		const repoSlug = `repository-${owner}-${name}`.toLowerCase();
		const repoCard = {
			name: `${owner}/${name}`,
			slug: repoSlug,
			type: 'repository@1.0.0',
			tags: [],
			data: {
				owner,
				name,
				git_url: repo.git_url,
				html_url: mirrorID,
			},
		};

		return {
			repoInfo: {
				slug: repoSlug,
				target: {
					id: {
						$eval: `cards[${options.index}].id`,
					},
					type: 'repository@1.0.0',
				},
			},
			card: makeCard(repoCard, options.actor, repo.created_at),
		};
	}

	async getPRFromEvent(github: any, event: any, options: any): Promise<any> {
		const root = getEventRoot(event);
		const prData: any = await this.generatePRDataFromEvent(github, event);
		const contractData = await this.loadContractFromPR(github, event, prData);
		const type = 'pull-request@1.0.0';

		const pullRequest =
			event.data.payload.pull_request || event.data.payload.issue.pull_request;

		const pr: any = {
			name: root.title,
			slug: `pull-request-${normaliseRootID(root.node_id)}`,
			type,
			tags: root.labels.map((label: any) => {
				return label.name;
			}),
			data: _.merge(
				{
					repository: event.data.payload.repository.full_name,
					git_url: event.data.payload.repository.git_url,
					ssh_url: event.data.payload.repository.ssh_url,
					mirrors: [getEventMirrorId(event)],
					mentionsUser: [],
					alertsUser: [],
					description: root.body || '',
					status: options.status,
					archived: false,
					closed_at: pullRequest.closed_at || null,
					merged_at: pullRequest.merged_at || null,
					contract: contractData,
					$transformer: {
						artifactReady: prData.head.sha,
					},
				},
				prData,
			),
		};

		if (options.id) {
			pr.id = options.id;
		}

		return pr;
	}

	async generatePRDataFromEvent(github: any, event: any): Promise<any> {
		let result = {};
		if (event.data.payload.pull_request) {
			result = gatherPRInfo(event.data.payload);
		} else {
			this.context.log.debug(GITHUB_API_REQUEST_LOG_TITLE, {
				category: 'pullRequests',
				action: 'get',
			});

			const pr = await githubRequest(
				github.pulls.get,
				{
					owner: event.data.payload.organization.login,
					repo: event.data.payload.repository.name,
					pull_number: event.data.payload.issue.number,
				},
				this.options,
			);
			result = gatherPRInfo({
				pull_request: pr.data,
			});
		}

		return result;
	}

	async loadContractFromPR(github: any, event: any, prData: any): Promise<any> {
		const orgName = event.data.payload.organization.login;
		const repoName = event.data.payload.repository.name;
		const commitRef = `${orgName}/${repoName}@${prData.head.sha}`;
		try {
			const contractFile = await githubRequest(
				github.repos.getContent,
				{
					owner: orgName,
					repo: repoName,
					path: 'balena.yml',
					ref: prData.head.sha,
				},
				this.options,
			);

			if (
				!contractFile.data ||
				contractFile.data.type !== 'file' ||
				!contractFile.data.size
			) {
				this.context.log.warn(`balena.yml in ${commitRef} is not a valid file`);
				return null;
			}

			const contract = YAML.parse(
				Buffer.from(contractFile.data.content, 'base64').toString('utf-8'),
			);
			if (!contract.type) {
				this.context.log.warn(
					`balena.yml in ${commitRef} is not a valid contract`,
				);
				return null;
			}
			return contract;
		} catch (err) {
			this.context.log.warn(`Couldn't get balena.yml for ${commitRef}`, err);
			return null;
		}
	}

	async createPRIfNotExists(github: any, event: any, actor: any): Promise<any> {
		const result = await this.createPRorIssueIfNotExists(
			github,
			event,
			actor,
			'pull-request@1.0.0',
		);

		if (_.isEmpty(result)) {
			return [];
		}
		const headPayload = event.data.payload.pull_request.head.repo;
		const basePayload = event.data.payload.pull_request.base.repo;

		let index = 1;
		const head = await this.getRepoCard(headPayload, {
			actor,
			index,
		});

		// If we created the repository, increment the index for links and add
		// the card to the result
		if (head.card) {
			result.push(head.card);
			index++;
		}
		const base = await this.getRepoCard(basePayload, {
			actor,
			index,
		});

		if (base.card) {
			if (_.isEqual(base.card, head.card)) {
				base.repoInfo.target.id.$eval = `cards[${--index}].id`;
			} else {
				result.push(base.card);
			}
		}

		return result.concat([
			makeCard(
				{
					name: 'has head at',
					slug: `link-${result[0].card.slug}-head-at-${head.repoInfo.slug}`.replace(
						/[@.]/g,
						'-',
					),
					type: 'link@1.0.0',
					data: {
						inverseName: 'is head of',
						from: {
							id: {
								$eval: 'cards[0].id',
							},
							type: {
								$eval: 'cards[0].type',
							},
						},
						to: head.repoInfo.target,
					},
				},
				actor,
			),
			makeCard(
				{
					name: 'has base at',
					slug: `link-${result[0].card.slug}-base-at-${base.repoInfo.slug}`.replace(
						/[@.]/g,
						'-',
					),
					type: 'link@1.0.0',
					data: {
						inverseName: 'is base of',
						from: {
							id: {
								$eval: 'cards[0].id',
							},
							type: {
								$eval: 'cards[0].type',
							},
						},
						to: base.repoInfo.target,
					},
				},
				actor,
			),
		]);
	}

	async createPRWithConnectedIssues(
		github: any,
		event: any,
		actor: any,
	): Promise<any> {
		const mirrorID = getEventMirrorId(event);
		const cards = await this.createPRIfNotExists(github, event, actor);
		if (_.isEmpty(cards)) {
			return [];
		}
		const pr = cards[0].card;

		const connectedIssue = _.chain(pr.data.description)
			.split('\n')
			.map((line: string) => {
				return _.trim(line, ' \n');
			})
			.filter((line: string) => {
				return /^[\w-]+:/.test(line);
			})
			.map((line: string) => {
				return _.split(line, /\s*:\s*/);
			})
			.fromPairs()
			.get(['Connects-to'])
			.value();

		if (connectedIssue) {
			const issueCard = await this.getCardByMirrorId(
				mirrorID,
				'pull-request@1.0.0',
			);
			if (issueCard) {
				cards.push(
					makeCard(
						{
							name: 'is attached to',
							slug: `link-${pr.slug}-is-attached-to-${issueCard.slug}`,
							type: 'link@1.0.0',
							data: {
								inverseName: 'has attached',
								from: {
									id: {
										$eval: 'cards[0].id',
									},
									type: {
										$eval: 'cards[0].type',
									},
								},
								to: {
									id: issueCard.id,
									type: issueCard.type,
								},
							},
						},
						actor,
					),
				);
			}
		}
		return cards;
	}

	async closePR(github: any, event: any, actor: any): Promise<any> {
		return this.closePRorIssue(github, event, actor, 'pull-request@1.0.0');
	}

	async labelEventPR(github: any, event: any, actor: any, action: any) {
		return this.labelPRorIssue(
			github,
			event,
			actor,
			action,
			'pull-request@1.0.0',
		);
	}

	async updatePR(github: any, event: any, actor: string): Promise<any> {
		const mirrorID = getEventMirrorId(event);
		const existingPR = await this.getCardByMirrorId(
			mirrorID,
			'pull-request@1.0.0',
		);
		const root = getEventRoot(event);

		if (_.isEmpty(existingPR)) {
			return this.createPRIfNotExists(github, event, actor);
		}

		const pr = await this.getCardFromEvent(github, event, {
			status: 'open',
		});

		return [makeCard(pr, actor, root.updated_at)];
	}

	async getIssueFromEvent(event: any, options: any) {
		const root = getEventRoot(event);
		const type = 'issue@1.0.0';

		const issue: any = {
			name: root.title,
			slug: `issue-${normaliseRootID(root.node_id)}`,
			type,
			tags: root.labels.map((label: any) => {
				return label.name;
			}),
			data: {
				repository: event.data.payload.repository.full_name,
				mirrors: [getEventMirrorId(event)],
				mentionsUser: [],
				alertsUser: [],
				description: root.body || '',
				status: options.status,
				archived: false,
			},
		};

		if (options.id) {
			issue.id = options.id;
		}

		return issue;
	}

	async createIssueIfNotExists(
		github: any,
		event: any,
		actor: string,
	): Promise<any> {
		return this.createPRorIssueIfNotExists(github, event, actor, 'issue@1.0.0');
	}

	async closeIssue(github: any, event: any, actor: string): Promise<any> {
		return this.closePRorIssue(github, event, actor, 'issue@1.0.0');
	}

	async updateIssue(
		github: any,
		event: any,
		actor: string,
		action: any,
	): Promise<any> {
		const issueMirrorId = getEventMirrorId(event);
		const issue = await this.getCardByMirrorId(issueMirrorId, 'issue@1.0.0');
		const root = getEventRoot(event);

		if (issue) {
			const issueCardFromEvent = await this.getCardFromEvent(github, event, {
				id: issue.id,
				status: 'open',
			});

			return [makeCard(issueCardFromEvent, actor, root.updated_at)];
		}

		const issueCard = await this.getCardFromEvent(
			github,
			revertEventChanges(event, 'issue'),
			{
				status: 'open',
			},
		);

		const sequence = [makeCard(issueCard, actor, root.created_at)];

		if (action === 'reopened') {
			const time = root.closed_at
				? root.closed_at
				: new Date(root.updated_at).getTime() - 1;

			const closedCard = await this.getCardFromEvent(
				github,
				revertEventChanges(event, 'issue'),
				{
					status: 'closed',
					id: {
						$eval: 'cards[0].id',
					},
				},
			);

			sequence.push(makeCard(closedCard, actor, time));
		}

		const openCard = await this.getCardFromEvent(github, event, {
			status: 'open',
			id: {
				$eval: 'cards[0].id',
			},
		});

		return sequence.concat([makeCard(openCard, actor, root.updated_at)]);
	}

	async labelEventIssue(
		github: any,
		event: any,
		actor: string,
		action: any,
	): Promise<any> {
		return this.labelPRorIssue(github, event, actor, action, 'issue@1.0.0');
	}

	async createIssueComment(
		github: any,
		event: any,
		actor: string,
	): Promise<any> {
		const issueMirrorId = getEventMirrorId(event);
		const type = eventToCardType(event);

		const issue = await this.getCardByMirrorId(issueMirrorId, type);
		const root = getEventRoot(event);

		if (await this.getCommentByMirrorId(getCommentMirrorIdFromEvent(event))) {
			return [];
		}

		if (issue) {
			return getCommentFromEvent(this.context, event, {
				actor,
				time: event.data.payload.comment.updated_at,
				target: issue.id,
				targetCard: issue,
				offset: 0,
				active: true,
			});
		}

		// PR comments are treated as issue comments by github
		const openCard = await this.getCardFromEvent(github, event, {
			status: 'open',
		});

		const sequence = [makeCard(openCard, actor, root.created_at)];

		if (root.state === 'closed') {
			const closedCard = updateCardFromSequence(sequence, 0, {
				data: {
					status: 'closed',
				},
			});

			sequence.push(makeCard(closedCard, actor, root.closed_at));
		}

		const upserts = sequence.concat(
			await this.getCommentsFromIssue(
				github,
				this.context,
				event,
				{
					$eval: 'cards[0].id',
				},
				[getCommentMirrorIdFromEvent(event)],
				{
					actor,
				},
			),
		);

		return upserts.concat(
			await getCommentFromEvent(this.context, event, {
				actor,
				time: event.data.payload.comment.created_at,
				offset: upserts.length,
				target: {
					$eval: 'cards[0].id',
				},
				targetCard: sequence[0].card,
				active: true,
			}),
		);
	}

	async editIssueComment(github: any, event: any, actor: any): Promise<any> {
		const updateTime = event.data.payload.comment.updated_at;

		const changes = {
			active: !event.data.payload.comment.deleted,
			data: {
				timestamp: new Date(updateTime).toISOString(),
				payload: {
					message: event.data.payload.comment.body,
				},
			},
		};

		const commentMirrorId = getCommentMirrorIdFromEvent(event);
		const comment = await this.getCommentByMirrorId(commentMirrorId);
		if (comment) {
			return [makeCard(_.merge(comment, changes), actor, updateTime)];
		}

		const issueMirrorId = getEventMirrorId(event);
		const type = eventToCardType(event);
		const issue = await this.getCardByMirrorId(issueMirrorId, type);
		const root = getEventRoot(event);
		const sequence: any[] = [];

		if (!issue) {
			const openCard = await this.getCardFromEvent(github, event, {
				status: 'open',
			});

			sequence.push(makeCard(openCard, actor, root.created_at));
		}

		const target = issue
			? issue.id
			: {
					$eval: `cards[${sequence.length - 1}].id`,
			  };

		const result: any[] = await this.getCommentsFromIssue(
			github,
			this.context,
			event,
			target,
			[],
			{
				actor,
			},
		);

		for (const item of result) {
			const githubUrl = _.find(item.card.data.mirrors, (mirror) => {
				return _.startsWith(mirror, 'https://github.com');
			});

			if (!githubUrl) {
				continue;
			}

			if (!(await this.getCommentByMirrorId(githubUrl))) {
				sequence.push(item);
			}
		}

		const index = _.findIndex(sequence, (element) => {
			return element.card.data.mirrors.includes(commentMirrorId);
		});

		if (index === -1) {
			const upserts = await getCommentFromEvent(this.context, event, {
				actor,
				time: event.data.payload.comment.updated_at,
				active: true,
				offset: sequence.length,
				target,
				targetCard: issue || sequence[0].card,
			});

			_.merge(upserts[0].card, changes);
			sequence.push(...upserts);
		} else {
			const time = event.data.payload.comment.updated_at;
			sequence.push(
				makeCard(updateCardFromSequence(sequence, index, changes), actor, time),
			);
		}

		return sequence;
	}

	async createPush(event: any, actor: string): Promise<any> {
		const beforeSHA = event.data.payload.before;
		const afterSHA = event.data.payload.after;

		const pushSlug = `gh-push-from-${beforeSHA}-to-${afterSHA}`;
		const push = await this.context.getElementBySlug(`${pushSlug}@latest`);

		if (push) {
			return [];
		}

		const result = [
			makeCard(
				{
					slug: pushSlug,
					type: 'gh-push@1.0.0',
					name: 'Push Event',
					data: {
						branch: event.data.payload.ref.replace(/^refs\/heads\//, ''),
						before: beforeSHA,
						after: afterSHA,
						author: event.data.payload.pusher.name,
						commits: event.data.payload.commits,
					},
				},
				actor,
				event.data.payload.repository.updated_at,
			),
		];

		const targetRepo = event.data.payload.repository;

		const repo = await this.getRepoCard(targetRepo, {
			actor,
			index: 1,
		});

		// If we created a repository add it to the result
		if (repo.card) {
			result.push(repo.card);
		}

		// Link the push to the repository
		return result.concat([
			makeCard(
				{
					name: 'refers to',
					slug: `link-gh-push-${afterSHA}-to-${repo.repoInfo.slug.replace(
						/_/g,
						'-',
					)}`,
					type: 'link@1.0.0',
					data: {
						inverseName: 'is referenced by',
						from: {
							id: {
								$eval: 'cards[0].id',
							},
							type: {
								$eval: 'cards[0].type',
							},
						},
						to: repo.repoInfo.target,
					},
				},
				actor,
			),
		]);
	}

	async closePRorIssue(
		github: any,
		event: any,
		actor: string,
		type: string,
	): Promise<any> {
		const issueMirrorId = getEventMirrorId(event);
		const issue = await this.getCardByMirrorId(issueMirrorId, type);
		const root = getEventRoot(event);

		if (issue) {
			if (issue.data.status === 'closed') {
				return [];
			}

			issue.data.status = 'closed';

			return [makeCard(issue, actor, root.closed_at)];
		}

		const prOpened = await this.getCardFromEvent(github, event, {
			status: 'open',
		});

		const prClosed = await this.getCardFromEvent(github, event, {
			status: 'closed',
			id: {
				$eval: 'cards[0].id',
			},
		});
		return [makeCard(prOpened, actor, root.created_at)]
			.concat(
				await this.getCommentsFromIssue(
					github,
					this.context,
					event,
					{
						$eval: 'cards[0].id',
					},
					[],
					{
						actor,
					},
				),
			)
			.concat([makeCard(prClosed, actor, root.closed_at)]);
	}

	async createPRorIssueIfNotExists(
		github: any,
		event: any,
		actor: string,
		type: string,
	): Promise<any> {
		const mirrorID = getEventMirrorId(event);
		const existingCard = await this.getCardByMirrorId(mirrorID, type);
		const root = getEventRoot(event);

		if (existingCard) {
			return [];
		}

		const card = await this.getCardFromEvent(github, event, {
			status: 'open',
		});

		return [makeCard(card, actor, root.created_at)];
	}

	async labelPRorIssue(
		github: any,
		event: any,
		actor: string,
		action: any,
		type: string,
	): Promise<any> {
		const issueMirrorId = getEventMirrorId(event);
		const issue = await this.getCardByMirrorId(issueMirrorId, type);
		const root = getEventRoot(event);

		if (issue) {
			const cardFromEvent = await this.getCardFromEvent(github, event, {
				status: root.state,
			});

			if (!_.isEqual(_.sortBy(cardFromEvent.tags), _.sortBy(issue.tags))) {
				cardFromEvent.id = issue.id;
				return [makeCard(cardFromEvent, actor, root.updated_at)];
			}

			return [];
		}

		const sequence: any[] = [];
		const card = await this.getCardFromEvent(github, event, {
			status: 'open',
		});

		const originalTags = _.clone(card.tags);

		if (action === 'labeled') {
			if (root.created_at === root.updated_at) {
				return [makeCard(card, actor, root.created_at)];
			}

			card.tags = _.without(card.tags, event.data.payload.label.name);

			sequence.push(makeCard(card, actor, root.created_at));

			if (root.state === 'closed') {
				const closedCard = makeCard(
					updateCardFromSequence(sequence, 0, {
						data: {
							status: 'closed',
						},
					}),
					actor,
					root.closed_at,
				);

				sequence.push(closedCard);
			}

			const updatedCard = updateCardFromSequence(
				sequence,
				sequence.length - 1,
				{
					tags: originalTags,
				},
			);

			return sequence.concat([makeCard(updatedCard, actor, root.updated_at)]);
		}

		sequence.push(makeCard(card, actor, root.created_at));

		if (event.data.payload.label) {
			sequence.push(
				makeCard(
					updateCardFromSequence(sequence, 0, {
						tags: card.tags.concat(event.data.payload.label.name),
					}),
					actor,
					(new Date(root.updated_at).getTime() - 1).toString(),
				),
			);
		}

		return sequence.concat([
			makeCard(
				updateCardFromSequence(sequence, 0, {
					tags: originalTags,
				}),
				actor,
				root.updated_at,
			),
		]);
	}

	async translate(event: any): Promise<any> {
		if (!this.options.token.api) {
			this.context.log.warn('No token set for github integration');
			return [];
		}

		const github = await this.getOctokit(
			this.context,
			event.data.payload.installation && event.data.payload.installation.id,
		);
		if (!github) {
			this.context.log.warn('Could not authenticate with GitHub');
			return [];
		}

		const type =
			event.data.headers['X-GitHub-Event'] ||
			event.data.headers['x-github-event'];
		const action = event.data.payload.action;
		const actor = await this.getLocalUser(github, event);
		assert.INTERNAL(null, actor, this.options.errors.SyncNoActor, () => {
			return `No actor id for ${JSON.stringify(event)}`;
		});

		switch (type) {
			case 'check_run': {
				const { repository } = event.data.payload;
				const checkRun = event.data.payload.check_run;
				const checkSuite = checkRun.check_suite;

				// If the check_suite has just been created, the updated_at and created_at fields are the same
				const timestamp = checkSuite.updated_at;

				let card: any = {};

				// Check if created in jellyfish
				if (
					checkRun.external_id.match(
						/^jellyfish_[A-F\d]{8}-[A-F\d]{4}-4[A-F\d]{3}-[89AB][A-F\d]{3}-[A-F\d]{12}$/i,
					)
				) {
					card.slug = `check-run-${checkRun.external_id}`;
				} else {
					// Not created in jellyfish
					card.slug = `check-run-${checkRun.id}`;
				}

				const currentContract = await this.context.getElementBySlug(
					`${card.slug}@1.0.0`,
				);

				const statuses: any = {
					queued: 0,
					in_progress: 1,
					completed: 2,
				};

				// Only advance status in the correct order, unless the action was re-requested
				let newStatus = checkRun.status;

				if (
					action !== 'rerequested_action' &&
					currentContract &&
					statuses[checkRun.status] < statuses[currentContract.data.status]
				) {
					newStatus = currentContract.data.status;
				}

				card = {
					...card,
					name: checkRun.app.name,
					type: 'check-run@1.0.0',
					data: {
						owner: repository.owner.login,
						repo: repository.full_name,
						head_sha: checkRun.head_sha,
						details_url: checkRun.details_url,
						status: newStatus,
						started_at: checkRun.started_at,
						conclusion: checkRun.conclusion,
						completed_at: checkRun.completed_at,
						check_run_id: String(checkRun.id),
					},
				};
				return [makeCard(card, actor, timestamp)];
			}

			case 'pull_request':
				// Create commit contract if open
				switch (action) {
					case 'opened':
					case 'edited':
						if (event.data.payload.pull_request.state === 'open') {
							const commitCard = makeCard(
								{
									slug: `commit-${event.data.payload.pull_request.head.sha.substring(
										0,
										8,
									)}`,
									name: `Commit ${event.data.payload.pull_request.head.sha.substring(
										0,
										8,
									)} for PR ${event.data.payload.pull_request.title}`,
									type: 'commit@1.0.0',
									data: {
										org: event.data.payload.pull_request.head.repo.full_name.split(
											'/',
										)[0],
										repo: event.data.payload.pull_request.head.repo.name,
										head_sha: event.data.payload.pull_request.head.sha,
										pull_request_title: event.data.payload.pull_request.title,
										pull_request_url: event.data.payload.pull_request.url,
									},
									artifact_ready: true,
								},
								actor,
							);

							const headPayload = event.data.payload.pull_request.head.repo;
							const headCard = await this.getRepoCard(headPayload, {
								actor,
								index: 1,
							});

							makeCard(
								{
									slug: `link-commit-pr-${event.data.payload.pull_request.head.sha.substring(
										0,
										8,
									)}-${event.data.payload.pull_request.title}`,
									type: 'link@1.0.0',
									name: 'is attached to PR',
									data: {
										inverseName: 'has attached commit',
										from: {
											id: commitCard.id,
											type: commitCard.type,
										},
										to: {
											id: headCard.id,
											type: headCard.type,
										},
									},
								},
								actor,
							);
						}
					default:
						break;
				}
				switch (action) {
					case 'review_requested':
						return this.createPRIfNotExists(github, event, actor);
					case 'opened':
					case 'assigned':
						return this.createPRWithConnectedIssues(github, event, actor);
					case 'closed':
						return this.closePR(github, event, actor);
					case 'labeled':
					case 'unlabeled':
						return this.labelEventPR(github, event, actor, action);
					case 'synchronize':
						return this.updatePR(github, event, actor);
					default:
						return [];
				}

			case 'issues':
				switch (action) {
					case 'opened':
					case 'assigned':
						return this.createIssueIfNotExists(github, event, actor);
					case 'closed':
						return this.closeIssue(github, event, actor);
					case 'reopened':
					case 'edited':
						return this.updateIssue(github, event, actor, action);
					case 'labeled':
					case 'unlabeled':
						return this.labelEventIssue(github, event, actor, action);
					default:
						return [];
				}

			case 'pull_request_review':
				switch (action) {
					case 'submitted':
						return this.createPRIfNotExists(github, event, actor);
					default:
						return [];
				}

			case 'issue_comment':
				event.data.payload.comment.deleted = action === 'deleted';
				switch (action) {
					case 'created':
						return this.createIssueComment(github, event, actor);
					case 'deleted':
						// Refactor a delete event to look like an edit on a
						// "deleted" property
						event.data.payload.comment.changes = {
							deleted: {
								from: false,
							},
						};

					// Falls through
					case 'edited':
						return this.editIssueComment(github, event, actor);
					default:
						return [];
				}

			case 'push':
				return this.createPush(event, actor);

			default:
				return [];
		}
	}

	async getCardByMirrorId(id: string, type: string): Promise<any> {
		return this.context.getElementByMirrorId(type, id);
	}

	async getCommentByMirrorId(id: string): Promise<any> {
		return this.context.getElementByMirrorId('message@1.0.0', id);
	}

	async getCardFromEvent(github: any, event: any, options: any): Promise<any> {
		switch (eventToCardType(event)) {
			case 'issue@1.0.0':
				return this.getIssueFromEvent(event, options);
			case 'pull-request@1.0.0':
				return this.getPRFromEvent(github, event, options);
			case 'repository@1.0.0':
				// return this.getRepoFromEvent(event, options)
				this.context.log.warn('getCardFromEvent - repository@1.0.0', {
					event,
					options,
				});
				throw new Error(
					'getCardFromEvent() called for "repository@1.0.0", not handled',
				);
			default:
				throw new Error('Unknown type');
		}
	}

	async queryComments(
		github: any,
		owner: any,
		repository: string,
		issue: number,
		page = 1,
	): Promise<any> {
		this.context.log.debug(GITHUB_API_REQUEST_LOG_TITLE, {
			category: 'issues',
			action: 'listComments',
		});

		const response = await githubRequest(
			github.issues.listComments,
			{
				owner,
				repo: repository,
				issue_number: issue,
				per_page: 100,
				page,
			},
			this.options,
		);

		return response.data;
	}

	async getCommentsFromIssue(
		github: any,
		_context: any,
		event: any,
		target: any,
		mirrorBlacklist: any,
		options: any,
	): Promise<any> {
		const root = getEventRoot(event);
		const response = await this.queryComments(
			github,
			event.data.payload.repository.owner.login,
			event.data.payload.repository.name,
			root.number,
		);

		return Bluebird.reduce(
			response,
			async (accumulator: any[], payload: any) => {
				const mirrorId = payload.html_url;
				if (mirrorBlacklist.includes(mirrorId)) {
					return accumulator;
				}

				const date = new Date(payload.updated_at);
				const card = await this.getCommentByMirrorId(mirrorId);
				const data = {
					mirrors: _.get(card, ['data', 'mirrors']) || [mirrorId],
					actor: _.get(card, ['data', 'actor']) || options.actor,
					target,
					timestamp: date.toISOString(),
					payload: {
						mentionsUser: [],
						alertsUser: [],
						mentionsGroup: [],
						alertsGroup: [],
						message: payload.body,
					},
				};

				const id = uuidv4();
				const comment: any = {
					slug: `message-${id}`,
					type: 'message@1.0.0',
					active: !payload.deleted,
					data,
				};

				if (card) {
					comment.id = card.id;
				}

				return accumulator.concat([
					makeCard(comment, options.actor, payload.updated_at),
				]);
			},
			[],
		);
	}

	async getLocalUser(github: any, event: any): Promise<any> {
		const remoteUser = await githubRequest(
			github.users.getByUsername,
			{
				username: event.data.payload.sender.login,
			},
			this.options,
		);

		const email =
			remoteUser.data.email &&
			remoteUser.data.email

				// Try to deal with emails such as
				// - "foo (at) gmail.com"
				// - "bar (a) hotmail.com"
				.replace(/\s*\(at?\)\s*/g, '@');

		return this.context.getActorId({
			// This is pretty much a free-form field.
			email: utils.isEmail(email) ? email : null,

			handle: remoteUser.data.login,
			company: remoteUser.data.company,
		});
	}
};

// TS-TODO: Don't export with module.exports
module.exports.slug = SLUG;

// TS-TODO: Don't export with module.exports44
// See https://developer.github.com/webhooks/securing/
module.exports.isEventValid = (
	token: any,
	rawEvent: any,
	headers: any,
): boolean => {
	const signature = headers['x-hub-signature'];
	if (!signature || !token || !token.signature) {
		return false;
	}

	const hash = crypto
		.createHmac('sha1', token.signature)
		.update(rawEvent)
		.digest('hex');
	return signature === `sha1=${hash}`;
};
