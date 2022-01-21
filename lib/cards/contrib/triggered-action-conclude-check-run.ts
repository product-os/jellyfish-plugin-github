import type { ContractDefinition } from '@balena/jellyfish-types/build/core';

const triggeredActionConcludeCheckRun: ContractDefinition = {
	slug: 'triggered-action-conclude-check-run',
	type: 'triggered-action@1.0.0',
	name: 'Triggered action for resolving transformer check runs',
	markers: [],
	data: {
		schedule: 'sync',
		filter: {
			$$links: {
				'has attached check run': {
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
									enum: ['queued', 'in_progress'],
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
									const: 'mergeable',
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
				$eval: "source.links['has attached check run']",
			},
			'each(link)': {
				$eval: 'link.id',
			},
		},
		arguments: {
			reason: 'Check-Run succeeded as its commit has become mergeable',
			patch: [
				{ op: 'replace', path: '/data/status', value: 'completed' },
				{ op: 'add', path: '/data/conclusion', value: 'success' },
				{
					op: 'add',
					path: '/data/completed_at',
					value: { $eval: 'now' },
				},
			],
		},
	},
};

export default triggeredActionConcludeCheckRun;
