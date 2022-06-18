import type { ContractDefinition } from '@balena/jellyfish-types/build/core';

export const triggeredActionFailedCheckRun: ContractDefinition = {
	slug: 'triggered-action-failed-check-run',
	type: 'triggered-action@1.0.0',
	name: 'Triggered action for failing transformer check runs',
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
									const: 'never',
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
			reason: 'Check-Run failed as its commit is never mergeable',
			patch: [
				{ op: 'replace', path: '/data/status', value: 'completed' },
				{ op: 'add', path: '/data/conclusion', value: 'failure' },
				{
					op: 'add',
					path: '/data/completed_at',
					value: { $eval: 'now' },
				},
			],
		},
	},
};
