import type { ContractDefinition } from 'autumndb';

export const githubOrg: ContractDefinition = {
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
						github_id: {
							type: 'string',
						},
						description: {
							type: 'string',
							format: 'markdown',
						},
						login: {
							type: 'string',
						},
						avatar_url: {
							type: 'string',
						},
						url: {
							type: 'string',
						},
					},
				},
			},
			required: ['name'],
		},
	},
};
