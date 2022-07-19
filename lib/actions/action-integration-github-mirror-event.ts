import { ActionDefinition, mirror } from '@balena/jellyfish-worker';

const handler: ActionDefinition['handler'] = async (
	session,
	context,
	card,
	request,
) => {
	return mirror('github', session, context, card, request);
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
						enum: [
							'issue@1.0.0',
							'pull-request@1.0.0',
							'message@1.0.0',
							'check-run@1.0.0',
						],
					},
				},
			},
			arguments: {},
		},
	},
};
