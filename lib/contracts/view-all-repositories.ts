import type { ContractDefinition } from 'autumndb';

export const viewAllRepositories: ContractDefinition = {
	slug: 'view-all-repositories',
	name: 'All Products',
	type: 'view@1.0.0',
	markers: ['org-balena'],
	data: {
		allOf: [
			{
				name: 'Repositories',
				schema: {
					type: 'object',
					properties: {
						active: {
							const: true,
							type: 'boolean',
						},
						type: {
							type: 'string',
							const: 'repository@1.0.0',
						},
					},
					required: ['active', 'type'],
				},
			},
		],
	},
};
