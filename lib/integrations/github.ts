import * as assert from '@balena/jellyfish-assert';
import {
	Integration,
	IntegrationDefinition,
	SequenceItem,
	syncErrors,
} from '@balena/jellyfish-worker';
import { createAppAuth } from '@octokit/auth-app';
import { retry } from '@octokit/plugin-retry';
import { throttling } from '@octokit/plugin-throttling';
import {
	Octokit as OctokitRest,
	Octokit as OctokitInstance,
} from '@octokit/rest';
import type { OctokitResponse } from '@octokit/types';
import type { Contract, ContractDefinition, EventContract } from 'autumndb';
import crypto from 'crypto';
import _ from 'lodash';
import { randomUUID } from 'node:crypto';
import * as url from 'node:url';
import YAML from 'yaml';
import * as utils from './utils';

// tslint:disable-next-line: no-var-requires
const packageJSON = require('../../package.json');

const GITHUB_API_REQUEST_LOG_TITLE = 'GitHub API Request';
const GITHUB_API_RETRY_COUNT = 5;
const SLUG = 'github';
const Octokit = OctokitRest.plugin(retry, throttling);

// Matches the prefix used when posting to GitHub on behalf of a user
const PREFIX_RE = /^\[.*\] /;

interface Eval {
	$eval: string;
}

const withoutPrefix = (body?: string | null) => {
	return body?.replace(PREFIX_RE, '');
};

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9-]/g, '-');

async function githubRequest<K, A1>(
	fn: (arg: A1) => Promise<OctokitResponse<K>>,
	arg: A1,
	options?: any,
	retries = 5,
): Promise<OctokitResponse<K>> {
	const result = await fn(arg);

	if (result.status >= 500) {
		assert.USER(null, retries > 0, syncErrors.SyncExternalRequestError, () => {
			return `GitHub unavailable ${result.status}: ${JSON.stringify(
				result.data,
				null,
				2,
			)}`;
		});

		options.context.log.warn('GitHub unavailable retry', {
			retries,
		});

		await new Promise((resolve) => {
			setTimeout(resolve, 5000);
		});
		return githubRequest(fn, arg, options, retries - 1);
	}

	return result;
}

function getEventRoot(event: EventContract): any {
	if (event.data.payload) {
		return (
			event.data.payload.issue ||
			event.data.payload.pull_request ||
			event.data.payload.check_run
		);
	}
}

function getEventMirrorId(event: EventContract): string {
	return getEventRoot(event)?.html_url;
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

function gatherPRInfo(payload: { pull_request: any }): any {
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
		gh_number: payload.pull_request.number,
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

/**
 * creates a contract creation request
 * @param contract a ContractDefinition to be created, after being processed by JSON-e (that's why "|any")
 * @param actor
 * @param time
 * @returns a contract creation request
 */
function makeCard(
	contract: ContractDefinition | any,
	actor: string,
	time?: string,
	skipOriginator?: boolean,
) {
	let date = new Date();
	if (time) {
		date = new Date(time);
	}
	contract.data.integration_source = SLUG;

	return {
		time: date,
		card: contract,
		actor,
		skipOriginator,
	};
}

async function getCommentFromEvent(_context: any, event: any, options: any) {
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

	const id = randomUUID();
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
				slug: slugify(`link-${slug}-is-attached-to-${options.targetCard.slug}`),
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

export class GithubIntegration implements Integration {
	public slug = SLUG;
	private installations: Record<string, number> = {};

	// TS-TODO: Use proper types
	public context: any;
	public options: any;

	// TS-TODO: Use proper types
	constructor(options: any) {
		this.options = options;
		this.context = this.options.context;
	}

	public async destroy() {
		return Promise.resolve();
	}

	async getOctokit(
		context: any,
		installationId?: number | 'app-scope',
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
			context.log.info('Using GitHub App based authentication', {
				installationId,
			});
			octokitOptions.authStrategy = createAppAuth;
			octokitOptions.auth = {
				appId: _.parseInt(this.options.token.appId),
				privateKey: Buffer.from(this.options.token.key, 'base64').toString(),
			};

			const github = new Octokit(octokitOptions);
			let token: any;
			try {
				if (installationId === 'app-scope') {
					({ token } = (await github.auth({
						type: 'app',
					})) as any);
				} else {
					({ token } = (await github.auth({
						type: 'installation',
						installationId,
					})) as any);
				}
			} catch (error) {
				context.log.error('Failed to authenticate with GitHub', {
					installationId,
					error,
				});
				throw error;
			}
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

	async getInstallationId(context: any, org: string) {
		if (!this.installations[org]) {
			const gh = await this.getOctokit(context, 'app-scope');
			if (!gh) {
				return;
			}
			const installs = await gh?.apps.listInstallations();
			if (installs?.status !== 200) {
				return;
			}

			this.installations = installs.data.reduce((map, i) => {
				let accountName = 'missing';
				if (i.account != null) {
					accountName = 'login' in i.account ? i.account.login : i.account.name;
				}
				return {
					...map,
					[accountName]: i.id,
				};
			}, {});
			context.log.info('GH installations updated', {
				installations: this.installations,
			});
		}
		return this.installations[org];
	}

	public async mirror(
		card: Contract,
		options: { actor: string },
	): Promise<SequenceItem[]> {
		if (!this.options.token.api) {
			this.context.log.warn('No token set for github integration');
			return [];
		}

		if (!this.options.token.key) {
			this.context.log.warn('No private key set for github integration');
			return [];
		}

		// TS-TODO: Stop casting
		const ghOrg = (card.data.org as string) || (card.data.owner as string);
		const installation = await this.getInstallationId(this.context, ghOrg);
		if (!installation) {
			this.context.log.warn('GH app not installed', { ghOrg });
			// TODO: tests expect to continue here, probably because the API is not properly mocked
			// return [];
		}

		const github = await this.getOctokit(
			this.context,
			await this.getInstallationId(this.context, ghOrg),
		);

		if (!github) {
			this.context.log.warn('Could not authenticate with GitHub');
			return [];
		}

		// TS-TODO: Stop casting
		const githubUrl = _.find(
			card.data.mirrors as string[],
			(mirror: string) => {
				return url.parse(mirror).host === 'github.com';
			},
		) as string;

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

		if (
			(baseType === 'issue' || baseType === 'pull-request') &&
			card.data.repository
		) {
			// TS-TODO: Stop casting
			const [owner, repo] = (card.data.repository as string).split('/');

			if (!githubUrl) {
				this.context.log.debug(GITHUB_API_REQUEST_LOG_TITLE, {
					category: 'issues',
					action: 'create',
				});

				const githubResult = await githubRequest(
					github.issues.create,
					{
						owner,
						repo,
						title: card.name || card.slug,
						body: `${prefix} ${card.data.description}`,
						labels: card.tags,
					},
					this.options,
				);

				card.data.mirrors = card.data.mirrors || [];

				// TS-TODO: Stop casting
				(card.data.mirrors as string[]).push(githubResult.data.html_url);

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
				syncErrors.SyncInvalidEvent,
				`No entity number in GitHub URL: ${githubUrl}`,
			);

			const result =
				baseType === 'pull-request'
					? await githubRequest(
							github.pulls.get,
							{
								owner,
								repo,
								pull_number: entityNumber,
							},
							this.options,
					  )
					: await githubRequest(
							github.issues.get,
							{
								owner,
								repo,
								issue_number: entityNumber,
							},
							this.options,
					  );

			// TS-TODO: Stop casting
			if (
				result.data.state !== card.data.status ||
				withoutPrefix(result.data.body) !==
					withoutPrefix(card.data.description as string) ||
				result.data.title !== card.name ||
				!_.isEqual(_.map(result.data.labels, 'name'), card.tags)
			) {
				const prefixMatch = result.data.body?.match(PREFIX_RE);
				// TS-TODO: Stop casting
				const body: string = prefixMatch
					? `${prefixMatch[0]}${card.data.description}`
					: (card.data.description as string);

				if (baseType === 'issue') {
					this.context.log.debug(GITHUB_API_REQUEST_LOG_TITLE, {
						category: 'issues',
						action: 'update',
					});
					// TS-TODO: Stop casting
					const updateOptions = {
						owner,
						repo,
						issue_number: _.parseInt(_.last(githubUrl.split('/')) || ''),
						title: card.name ?? card.slug,
						body,
						state: card.data.status as 'open' | 'closed',
						labels: card.tags,
					};

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
					// TS-TODO: Stop casting
					const updateOptions = {
						owner,
						repo,
						pull_number: _.parseInt(_.last(githubUrl.split('/')) || ''),
						title: card.name || card.slug,
						body,
						state: card.data.status as 'open' | 'closed',
						labels: card.tags,
					};

					await githubRequest(github.pulls.update, updateOptions, this.options);
				}
			}

			return [];
		}

		if (baseType === 'message') {
			const issue = await this.context.getElementById(card.data.target);
			if (!issue) {
				return [];
			}
			const issueBaseType = issue.type.split('@')[0];
			if (issueBaseType !== 'issue' && issueBaseType !== 'pull-request') {
				return [];
			}

			if (!issue.data.repository) {
				return [];
			}

			const issueGithubUrl = _.find(issue.data.mirrors, (mirror: string) => {
				return url.parse(mirror).host === 'github.com';
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

				// TS-TODO: Stop casting
				const result = await githubRequest(
					github.issues.createComment,
					{
						owner: repoDetails.owner,
						repo: repoDetails.repository,
						issue_number: _.parseInt(
							_.last((issueGithubUrl || issue.data.repository).split('/')) ||
								'',
						),
						body: `${prefix} ${(card.data.payload as any).message}`,
					},
					this.options,
				);

				card.data.mirrors = card.data.mirrors || [];

				// TS-TODO: Stop casting
				(card.data.mirrors as string[]).push(result.data.html_url);

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

				// TS-TODO: Stop casting
				if (
					result.data.body !== `${prefix} ${(card.data.payload as any).message}`
				) {
					this.context.log.debug(GITHUB_API_REQUEST_LOG_TITLE, {
						category: 'issues',
						action: 'updateComment',
					});

					// TS-TODO: Stop casting
					await githubRequest(
						github.issues.updateComment,
						{
							owner: repoDetails.owner,
							repo: repoDetails.repository,
							comment_id: result.data.id,
							body: (card.data.payload as any).message,
						},
						this.options,
					);
				}
			} catch (error: any) {
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

	async getRepoCard(repo: any, options: any) {
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
		const repoSlug = slugify(`repository-${owner}-${name}`);
		const repoCard: ContractDefinition = {
			name,
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

		const githubOrg = await this.getCardByMirrorId(
			`https://github.com/${owner}`,
			'github-org@1.0.0',
		);
		if (githubOrg) {
			repoCard.loop = githubOrg.loop;
		} else {
			this.context.log.warn(
				`Cannot determine repo loop (no github-org contract found with name '${owner}')`,
			);
		}

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

	async getPRFromEvent(github: OctokitInstance, event: any, options: any) {
		const root = getEventRoot(event);
		const prData: any = await this.generatePRDataFromEvent(github, event);
		const contractData = await this.loadContractFromPR(github, event, prData);
		const type = 'pull-request@1.0.0';

		const pullRequest =
			event.data.payload.pull_request || event.data.payload.issue.pull_request;
		const pr: ContractDefinition = {
			name: (root.title || '').trim(),
			slug: slugify(`pull-request-${normaliseRootID(root.node_id)}`),
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
					status: pullRequest.state,
					archived: false,
					closed_at: pullRequest.closed_at,
					merged_at: pullRequest.merged_at,
					contract: contractData,
				},
				prData,
			),
		};

		if (options.id) {
			pr.id = options.id;
		}

		return pr;
	}

	async generatePRDataFromEvent(github: OctokitInstance, event: any) {
		let result = {};
		const payload = event.data.payload;
		if (payload.pull_request) {
			result = gatherPRInfo(payload);
		} else {
			this.context.log.debug(GITHUB_API_REQUEST_LOG_TITLE, {
				category: 'pullRequests',
				action: 'get',
			});

			const pr = await githubRequest(
				github.pulls.get,
				{
					owner: (payload.organization || payload.sender).login,
					repo: payload.repository.name,
					pull_number: payload.issue.number,
				},
				this.options,
			);
			result = gatherPRInfo({
				pull_request: pr.data,
			});
		}

		return result;
	}

	async loadContractFromPR(github: OctokitInstance, event: any, prData: any) {
		const payload = event.data.payload;
		const orgName = (payload.organization || payload.sender).login;
		const repoName = payload.repository.name;
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

			if (!('type' in contractFile.data && 'content' in contractFile.data)) {
				this.context.log.warn(
					`balena.yml in ${commitRef} was of unexpected type`,
				);
				return null;
			}

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

	async createPR(github: OctokitInstance, event: any, actor: any) {
		const root = getEventRoot(event);
		const contractsToCreate = [
			makeCard(
				await this.getCardFromEvent(github, event),
				actor,
				root.created_at,
			),
		];

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
			contractsToCreate.push(head.card);
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
				contractsToCreate.push(base.card);
			}
		}

		return contractsToCreate.concat([
			makeCard(
				{
					name: 'has head at',
					slug: slugify(
						`link-${contractsToCreate[0].card.slug}-head-at-${head.repoInfo.slug}`,
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
					slug: slugify(
						`link-${contractsToCreate[0].card.slug}-base-at-${base.repoInfo.slug}`,
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

	async labelEventPR(
		github: OctokitInstance,
		event: any,
		actor: any,
		action: any,
	) {
		return this.labelPRorIssue(
			github,
			event,
			actor,
			action,
			'pull-request@1.0.0',
		);
	}

	async updatePR(
		existingPR: Contract<any>,
		github: OctokitInstance,
		event: any,
		actor: string,
	) {
		const root = getEventRoot(event);

		const pr = await this.getCardFromEvent(github, event, {
			id: existingPR.id,
		});

		return [makeCard(pr, actor, root.updated_at)];
	}

	async getIssueFromEvent(event: any, options: any) {
		const root = getEventRoot(event);
		const type = 'issue@1.0.0';

		const issue: ContractDefinition = {
			name: (root.title || '').trim(),
			slug: slugify(`issue-${normaliseRootID(root.node_id)}`),
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
		github: OctokitInstance,
		event: any,
		actor: string,
	) {
		return this.createCardIfNotExists(github, event, actor, 'issue@1.0.0');
	}

	async updateIssue(
		github: OctokitInstance,
		event: any,
		actor: string,
		action: any,
	) {
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
		github: OctokitInstance,
		event: any,
		actor: string,
		action: any,
	) {
		return this.labelPRorIssue(github, event, actor, action, 'issue@1.0.0');
	}

	async createIssueComment(github: OctokitInstance, event: any, actor: string) {
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

	async editIssueComment(github: OctokitInstance, event: any, actor: any) {
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
			const githubUrl = _.find(item.card.data.mirrors, (mirror: string) => {
				return url.parse(mirror).host === 'github.com';
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

	async closeIssue(github: OctokitInstance, event: any, actor: string) {
		const contractMirrorId = getEventMirrorId(event);
		const existingContract = await this.getCardByMirrorId(
			contractMirrorId,
			'issue@1.0.0',
		);
		const root = getEventRoot(event);

		if (existingContract) {
			if (existingContract.data.status === 'closed') {
				return [];
			}

			existingContract.data.status = 'closed';

			return [makeCard(existingContract, actor, root.closed_at)];
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

	async createCardIfNotExists(
		github: OctokitInstance,
		event: any,
		actor: string,
		type: string,
	) {
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
		github: OctokitInstance,
		event: any,
		actor: string,
		action: any,
		type: string,
	) {
		const issueMirrorId = getEventMirrorId(event);
		const existingContract = await this.getCardByMirrorId(issueMirrorId, type);
		const root = getEventRoot(event);

		if (existingContract) {
			const contractFromEvent = await this.getCardFromEvent(github, event, {
				status: root.state,
			});

			if (
				!_.isEqual(
					_.sortBy(contractFromEvent.tags),
					_.sortBy(existingContract.tags),
				)
			) {
				contractFromEvent.id = existingContract.id;
				return [makeCard(contractFromEvent, actor, root.updated_at)];
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
						tags: (card.tags || []).concat(event.data.payload.label.name),
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

	public async translate(event: Contract): Promise<SequenceItem[]> {
		if (!this.options.token.api) {
			this.context.log.warn('No token set for github integration');
			return [];
		}

		// TS-TODO: Stop casting
		const github = await this.getOctokit(
			this.context,
			(event.data.payload as any).installation &&
				(event.data.payload as any).installation.id,
		);
		if (!github) {
			this.context.log.warn('Could not authenticate with GitHub');
			return [];
		}

		// TS-TODO: Stop casting
		const type =
			(event.data as any).headers['X-GitHub-Event'] ||
			(event.data as any).headers['x-github-event'];
		const action = (event.data.payload as any).action;
		const actor = await this.getLocalUser(github, event);
		assert.INTERNAL(null, actor, syncErrors.SyncNoActor, () => {
			return `No actor id for ${JSON.stringify(event)}`;
		});

		// TS-TODO: Stop casting
		const mirrorId = getEventMirrorId(event as EventContract);
		this.context.log.info('syncing GH event', {
			mirrorId,
			type,
			action,
		});

		switch (type) {
			case 'pull_request': {
				// TS-TODO: Stop casting
				const prMirrorID: string = (event.data.payload as any).pull_request
					.html_url;
				const existingPR: Contract<any> =
					prMirrorID &&
					(await this.getCardByMirrorId(prMirrorID, 'pull-request@1.0.0'));
				switch (action) {
					case 'review_requested':
					case 'opened':
					case 'edited':
					case 'synchronize':
					case 'closed':
					case 'assigned': {
						const sequence = existingPR
							? await this.updatePR(existingPR, github, event, actor)
							: await this.createPR(github, event, actor);
						return sequence;
					}
					case 'labeled':
					case 'unlabeled':
						return this.labelEventPR(github, event, actor, action);
					default:
						return [];
				}
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
				return [];

			case 'issue_comment':
				// TS-TODO: Stop casting
				(event.data.payload as any).comment.deleted = action === 'deleted';
				switch (action) {
					case 'created':
						return this.createIssueComment(github, event, actor);
					case 'deleted':
						// Refactor a delete event to look like an edit on a "deleted" property
						// TS-TODO: Stop casting
						(event.data.payload as any).comment.changes = {
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

			default:
				return [];
		}
	}

	async getCardByMirrorId(id: string, type: string) {
		return this.context.getElementByMirrorId(type, id);
	}

	async getCommentByMirrorId(id: string) {
		return this.context.getElementByMirrorId('message@1.0.0', id);
	}

	async getCardFromEvent(
		github: OctokitInstance,
		event: any,
		options: { status?: string; id?: string | Eval } = {},
	) {
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
		github: OctokitInstance,
		owner: any,
		repository: string,
		issue: number,
		page = 1,
	) {
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
		github: OctokitInstance,
		_context: any,
		event: any,
		target: any,
		mirrorBlacklist: any,
		options: any,
	) {
		const root = getEventRoot(event);
		const response = await this.queryComments(
			github,
			event.data.payload.repository.owner.login,
			event.data.payload.repository.name,
			root.number,
		);

		return Promise.all(
			response
				.filter((p) => !mirrorBlacklist.includes(p.html_url))
				.map(async (comment) => {
					const mirrorId = comment.html_url;
					const date = new Date(comment.updated_at);
					const existingContract = await this.getCommentByMirrorId(mirrorId);
					const data = {
						mirrors: _.get(existingContract, ['data', 'mirrors']) || [mirrorId],
						actor: _.get(existingContract, ['data', 'actor']) || options.actor,
						target,
						timestamp: date.toISOString(),
						payload: {
							mentionsUser: [],
							alertsUser: [],
							mentionsGroup: [],
							alertsGroup: [],
							message: comment.body,
						},
					};

					const newId = randomUUID();
					const commentContract = {
						id: existingContract?.id ?? newId,
						slug: existingContract?.slug ?? `message-${newId}`,
						type: 'message@1.0.0',
						// this was `!payload.deleted,` before, but this doesn't exist according to https://docs.github.com/en/rest/reference/issues#list-issue-comments
						// to know about a deleted comment we'd have to query the comment ID and check for 404.
						// But in this moment in time we know it exists, otherwise `list` wouldn't return it.
						active: true,
						data,
					};
					return makeCard(commentContract, options.actor, comment.updated_at);
				}),
		);
	}

	async getLocalUser(github: OctokitInstance, event: any) {
		const remoteUser = await githubRequest(
			github.users.getByUsername,
			{
				username: event.data.payload.sender.login,
			},
			this.options,
		);

		const email =
			typeof remoteUser.data.email === 'string'
				? remoteUser.data.email

						// Try to deal with emails such as
						// - "foo (at) gmail.com"
						// - "bar (a) hotmail.com"
						.replace(/\s*\(at?\)\s*/g, '@')
				: '';

		return this.context.getActorId({
			// This is pretty much a free-form field.
			email: utils.isEmail(email) ? email : null,

			handle: remoteUser.data.login,
			company: remoteUser.data.company,
		});
	}
}

export const githubIntegrationDefinition: IntegrationDefinition = {
	slug: SLUG,

	initialize: async (options) => new GithubIntegration(options),
	isEventValid: (_logContext, token, rawEvent, headers): boolean => {
		const signature = headers['x-hub-signature'];
		if (!signature || !token || !token.signature) {
			return false;
		}

		const hash = crypto
			.createHmac('sha1', token.signature)
			.update(rawEvent)
			.digest('hex');
		return signature === `sha1=${hash}`;
	},
};
