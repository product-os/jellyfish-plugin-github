import { defaultEnvironment } from '@balena/jellyfish-environment';
import type { TypeContract } from '@balena/jellyfish-types/build/core';
import type { ActionDefinition } from '@balena/jellyfish-worker';
import { getLogger, LogContext } from '@balena/jellyfish-logger';
import * as _ from 'lodash';
import { GithubIntegration } from '../integrations/github';

const logger = getLogger(__filename);

// Stub the context.log object required for the GitHub integration class
const getContextLogger = (logContext: LogContext) => {
	return {
		warn: (message: string, data: any) => {
			logger.warn(logContext, message, data);
		},
		error: (message: string, data: any) => {
			logger.error(logContext, message, data);
		},
		debug: (message: string, data: any) => {
			logger.debug(logContext, message, data);
		},
		info: (message: string, data: any) => {
			logger.info(logContext, message, data);
		},
		exception: (message: string, error: any) => {
			logger.exception(logContext, message, error);
		},
	};
};

// Instantiate an integration instance, so that we can re-use the logic for
// setting up an authenticated Octokit instance.
// The full sync-context object isn't used here as all we need is the log interface.
const integration = new GithubIntegration({
	token: defaultEnvironment.integration.github,
	log: getContextLogger({ id: 'github-integration' }),
});

const handler: ActionDefinition['handler'] = async (
	session,
	context,
	card,
	request,
) => {
	const ghOrgSlug = card.data.owner as string;
	// Check to see if the org exists
	let [org] = await context.query(
		session,
		{
			type: 'object',
			properties: {
				type: {
					const: 'github-org',
				},
				data: {
					type: 'object',
					properties: {
						mirrors: {
							type: 'array',
							contains: {
								type: 'string',
								const: `https://github.com/${ghOrgSlug}`,
							},
						},
					},
				},
			},
		},
		{ limit: 1 },
	);

	// If the org already exists, check to see if we need to create a link to it
	if (org) {
		const [repoWithLink] = await context.query(
			session,
			{
				$$links: {
					'belongs to': {
						type: 'object',
						properties: {
							type: {
								const: 'github-org',
							},
						},
					},
				},
				type: 'object',
				properties: {
					type: {
						const: 'repository@1.0.0',
					},
					id: {
						const: card.id,
					},
				},
			},
			{ limit: 1 },
		);

		// If the org and link exist, we're done
		if (repoWithLink) {
			return {
				id: org.id,
				type: org.type,
				version: org.version,
				slug: org.slug,
			};
		}
	} else {
		// Otherwise fetch the org from GitHub and create a new contract for it
		const integrationContext = {
			log: getContextLogger(request.logContext),
		};
		const installationId = await integration.getInstallationId(
			integrationContext,
			ghOrgSlug,
		);
		const octokit = await integration.getOctokit(
			integrationContext,
			installationId,
		);
		if (!octokit) {
			throw new Error('Could not get authenticate with GitHub');
		}
		const result = await octokit.orgs.get({
			org: ghOrgSlug,
		});

		if (!result) {
			throw new Error(`Could not get retrieve org from GitHub: ${ghOrgSlug}`);
		}

		const orgTypeContract = context.cards['github-org@1.0.0'] as TypeContract;
		const orgResult = await context.insertCard(
			session,
			orgTypeContract,
			{
				timestamp: request.timestamp,
				actor: request.actor,
				originator: request.originator,
				reason: request.arguments.reason,
				attachEvents: true,
			},
			{
				type: 'github-org@1.0.0',
				name: result.data.name,
				data: {
					github_id: result.data.id,
					description: result.data.description,
					login: result.data.login,
					avatar_url: result.data.avatar_url,
					url: result.data.url,
				},
			},
		);

		if (!orgResult) {
			throw new Error(`Could not create org in database: ${ghOrgSlug}`);
		}

		org = orgResult;
	}

	// Finally link the org to the repoitory contract
	const linkTypeContract = context.cards['link@1.0.0'] as TypeContract;
	await context.insertCard(
		session,
		linkTypeContract,
		{
			timestamp: request.timestamp,
			actor: request.actor,
			originator: request.originator,
			reason: request.arguments.reason,
			attachEvents: true,
		},
		{
			type: 'link@1.0.0',
			name: 'belongs to',
			data: {
				inverseName: 'has',
				from: {
					id: card.id,
					type: card.type,
				},
				to: {
					id: org.id,
					type: org.type,
				},
			},
		},
	);

	return {
		id: org.id,
		type: org.type,
		version: org.version,
		slug: org.slug,
	};
};

export const actionIntegrationGitHubMirrorEvent: ActionDefinition = {
	handler,
	contract: {
		slug: 'action-integration-github-mirror-event',
		version: '1.0.0',
		type: 'action@1.0.0',
		data: {
			filter: {
				type: 'object',
				required: ['type'],
				properties: {
					type: {
						type: 'string',
						const: 'repository@1.0.0',
					},
				},
			},
			arguments: {},
		},
	},
};
