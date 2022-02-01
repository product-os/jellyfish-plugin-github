import { ContractDefinition } from '@balena/jellyfish-types/build/core';

export const push: ContractDefinition = {
	slug: 'gh-push',
	name: 'Push',
	type: 'type@1.0.0',
	markers: [],
	data: {
		schema: {
			type: 'object',
			properties: {
				data: {
					type: 'object',
					properties: {
						before: {
							type: 'string',
							pattern: '^[a-f0-9]{7,40}$',
						},
						after: {
							type: 'string',
							pattern: '^[a-f0-9]{7,40}$',
						},
						commits: {
							type: 'array',
							items: {
								type: 'object',
							},
						},
						author: {
							type: 'string',
						},
						branch: {
							type: 'string',
						},
					},
					required: ['before', 'after', 'branch'],
				},
			},
			required: ['data'],
		},
	},
};
