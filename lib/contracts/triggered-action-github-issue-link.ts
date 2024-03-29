import type { ContractDefinition } from 'autumndb';

export const triggeredActionGitHubIssueLink: ContractDefinition = {
	slug: 'triggered-action-github-issue-link',
	type: 'triggered-action@1.0.0',
	name: 'Triggered action for broadcasting links from a support thread to GitHub issue or pull request',
	markers: [],
	data: {
		schedule: 'async',
		filter: {
			title: 'Create event for link between support thread and GitHub issue/PR',
			type: 'object',
			required: ['active', 'type', 'data'],
			additionalProperties: true,
			properties: {
				active: {
					type: 'boolean',
					const: true,
				},
				type: {
					type: 'string',
					const: 'create@1.0.0',
				},
				data: {
					type: 'object',
					required: ['payload'],
					properties: {
						payload: {
							type: 'object',
							required: ['type', 'data'],
							properties: {
								type: {
									type: 'string',
									const: 'link@1.0.0',
								},
								data: {
									type: 'object',
									required: ['from', 'to'],
									properties: {
										from: {
											type: 'object',
											required: ['type'],
											properties: {
												type: {
													type: 'string',
													enum: ['support-thread@1.0.0', 'sales-thread@1.0.0'],
												},
											},
										},
										to: {
											type: 'object',
											required: ['type'],
											properties: {
												type: {
													type: 'string',
													enum: ['issue@1.0.0', 'pull-request@1.0.0'],
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
		},
		action: 'action-broadcast@1.0.0',
		target: {
			$eval: 'source.data.payload.data.to.id',
		},
		arguments: {
			message:
				'This ${source.data.payload.data.inverseName} https://jel.ly.fish/${source.data.payload.data.from.id}',
		},
	},
};
