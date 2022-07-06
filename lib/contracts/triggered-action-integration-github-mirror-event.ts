import type { ContractDefinition } from 'autumndb';

export const triggeredActionIntegrationGitHubMirrorEvent: ContractDefinition = {
	slug: 'triggered-action-integration-github-mirror-event',
	type: 'triggered-action@1.0.0',
	name: 'Triggered action for GitHub mirrors',
	markers: [],
	data: {
		filter: {
			type: 'object',
			required: ['type'],
			properties: {
				type: {
					type: 'string',
					const: 'message@1.0.0',
				},
				name: {
					type: ['null', 'string'],
				},
				data: {
					type: 'object',
				},
			},
			$$links: {
				'is attached to': {
					type: 'object',
					properties: {
						type: {
							type: 'string',
							enum: ['issue@1.0.0', 'pull-request@1.0.0'],
						},
					},
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
