import { mirror } from '@balena/jellyfish-action-library/build/actions/mirror';
import type { ActionFile } from '@balena/jellyfish-plugin-base';

const handler: ActionFile['handler'] = async (
	session,
	context,
	card,
	request,
) => {
	return mirror('github', session, context, card, request);
};

export const actionIntegrationGitHubMirrorEvent: ActionFile = {
	handler,
	card: {
		slug: 'action-integration-github-mirror-event',
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
