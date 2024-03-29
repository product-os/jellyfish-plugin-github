import type { ContractDefinition } from 'autumndb';

export const viewAllIssues: ContractDefinition = {
	slug: 'view-all-issues',
	name: 'All GitHub issues',
	type: 'view@1.0.0',
	markers: ['org-balena'],
	data: {
		allOf: [
			{
				name: 'Active cards',
				schema: {
					$$links: {
						'has attached element': {
							type: 'object',
							properties: {
								type: {
									enum: [
										'message@1.0.0',
										'update@1.0.0',
										'create@1.0.0',
										'whisper@1.0.0',
									],
								},
							},
							additionalProperties: true,
						},
					},
					type: 'object',
					properties: {
						active: {
							const: true,
							type: 'boolean',
						},
						type: {
							type: 'string',
							const: 'issue@1.0.0',
						},
					},
					required: ['active', 'type'],
					additionalProperties: true,
				},
			},
		],
	},
};
