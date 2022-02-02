import type { ContractDefinition } from '@balena/jellyfish-types/build/core';

export const triggeredActionSupportClosedIssueReopen: ContractDefinition = {
	slug: 'triggered-action-support-closed-issue-reopen',
	type: 'triggered-action@1.0.0',
	name: 'Triggered action for reopening support threads when issues are closed',
	markers: [],
	data: {
		schedule: 'sync',
		filter: {
			$$links: {
				'is attached to': {
					$$links: {
						'issue has attached support thread': {
							type: 'object',
							required: ['type', 'data'],
							properties: {
								type: {
									type: 'string',
									const: 'support-thread@1.0.0',
								},
								data: {
									type: 'object',
									required: ['status'],
									properties: {
										status: {
											type: 'string',
											not: {
												const: 'open',
											},
										},
									},
								},
							},
						},
					},
					type: 'object',
					required: ['active', 'type', 'data'],
					properties: {
						active: {
							type: 'boolean',
							const: true,
						},
						type: {
							type: 'string',
							const: 'issue@1.0.0',
						},
						data: {
							type: 'object',
							required: ['status'],
							properties: {
								status: {
									type: 'string',
									const: 'closed',
								},
							},
						},
					},
				},
			},
			type: 'object',
			required: ['active', 'type', 'data'],
			properties: {
				active: {
					type: 'boolean',
					const: true,
				},
				type: {
					type: 'string',
					const: 'update@1.0.0',
				},
				data: {
					type: 'object',
					required: ['payload'],
					properties: {
						payload: {
							type: 'array',
							contains: {
								type: 'object',
								required: ['op', 'path', 'value'],
								properties: {
									op: {
										type: 'string',
										const: 'replace',
									},
									path: {
										type: 'string',
										const: '/data/status',
									},
									value: {
										type: 'string',
										const: 'closed',
									},
								},
							},
						},
					},
				},
			},
		},
		action: 'action-update-card@1.0.0',
		target: {
			$map: {
				$eval:
					"source.links['is attached to'][0].links['issue has attached support thread'][0:]",
			},
			'each(link)': {
				$eval: 'link.id',
			},
		},
		arguments: {
			reason: 'Support Thread re-opened because linked Issue was closed',
			patch: [
				{
					op: 'replace',
					path: '/data/status',
					value: 'open',
				},
			],
		},
	},
};
