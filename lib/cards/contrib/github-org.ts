import type { ContractDefinition } from '@balena/jellyfish-types/build/core';

const githubOrg: ContractDefinition = {
	slug: 'github-org',
	name: 'GitHub Organization',
	type: 'type@1.0.0',
	data: {
		schema: {
			type: 'object',
			properties: {
				name: {
					type: 'string',
					fullTextSearch: true,
				},
				data: {
					type: 'object',
					properties: {
						description: {
							type: 'string',
							format: 'markdown',
						},
					},
				},
			},
			required: ['name'],
		},
	},
};

export default githubOrg;
