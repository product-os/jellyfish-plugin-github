import type { ContractDefinition } from '@balena/jellyfish-types/build/core';

export const triggeredActionIntegrationGitHubMirrorEntities: ContractDefinition =
	{
		slug: 'triggered-action-integration-github-mirror-entities',
		type: 'triggered-action@1.0.0',
		name: 'Triggered action for mirroring GitHub entities',
		markers: [],
		data: {
			filter: {
				type: 'object',
				required: ['type'],
				properties: {
					type: {
						type: 'string',
						enum: ['issue@1.0.0', 'pull-request@1.0.0', 'check-run@1.0.0'],
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
