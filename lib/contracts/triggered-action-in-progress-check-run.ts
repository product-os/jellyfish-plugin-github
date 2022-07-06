import type { ContractDefinition } from 'autumndb';

export const triggeredActionInProgressCheckRun: ContractDefinition = {
	slug: 'triggered-action-in-progress-check-run',
	type: 'triggered-action@1.0.0',
	name: 'Triggered action for marking transformer check runs as in progress',
	markers: [],
	data: {
		schedule: 'sync',
		filter: {
			$$links: {
				'has attached': {
					type: 'object',
					required: ['active', 'type'],
					properties: {
						active: {
							type: 'boolean',
							const: true,
						},
						type: {
							type: 'string',
							const: 'check-run@1.0.0',
						},
						data: {
							type: 'object',
							required: ['status'],
							properties: {
								status: {
									type: 'string',
									const: 'queued',
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
					const: 'commit@1.0.0',
				},
				data: {
					type: 'object',
					required: ['$transformer'],
					properties: {
						$transformer: {
							type: 'object',
							required: ['mergeable'],
							properties: {
								mergeable: {
									type: 'string',
									const: 'pending',
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
				$eval: "source.links['has attached']",
			},
			'each(link)': {
				$eval: 'link.id',
			},
		},
		arguments: {
			reason:
				'Check-Run started as its commit has an undetermined mergeable status',
			patch: [{ op: 'replace', path: '/data/status', value: 'in_progress' }],
		},
	},
};
