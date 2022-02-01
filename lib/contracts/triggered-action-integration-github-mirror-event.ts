import { ContractDefinition } from '@balena/jellyfish-types/build/core';

export const triggeredActionIntegrationGitHubMirrorEvent: ContractDefinition = {
	slug: 'triggered-action-integration-github-mirror-event',
	type: 'triggered-action@1.0.0',
	name: 'Triggered action for GitHub mirrors',
	markers: [],
	data: {
		schedule: 'sync',
		filter: {
			type: 'object',
			required: ['type'],
			properties: {
				type: {
					type: 'string',
					enum: [
						'message@1.0.0',
						'issue@1.0.0',
						'pull-request@1.0.0',
						'check-run@1.0.0',
					],
				},
				name: {
					type: ['null', 'string'],
				},
				data: {
					type: 'object',
				},
			},
		},
		action: 'action-integration-github-mirror-event@1.0.0',
		target: {
			$eval: 'source.id',
		},
		arguments: {},
	},
};
