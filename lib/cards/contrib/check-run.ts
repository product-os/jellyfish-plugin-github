/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

import type { ContractDefinition } from '@balena/jellyfish-types/build/core';

export default function ({
	mixin,
	withEvents,
}: {
	mixin: any;
	withEvents?: any;
}): ContractDefinition {
	return mixin(withEvents)({
		slug: 'check-run',
		name: 'Check Run',
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
						required: ['repo'],
						type: 'object',
						properties: {
							owner: {
								type: 'string',
							},
							repo: {
								type: 'string',
							},
							head_sha: {
								type: 'string',
							},
							details_url: {
								type: 'string',
							},
							status: {
								type: 'string',
								enum: ['queued', 'in_progress', 'completed'],
							},
							started_at: {
								type: 'string',
							},
							conclusion: {
								oneOf: [
									{
										type: 'string',
										enum: [
											'action_required',
											'cancelled',
											'failure',
											'neutral',
											'success',
											'skipped',
											'stale',
											'timed_out',
										],
									},
									{
										type: 'null',
									},
								],
							},
							completed_at: {
								oneOf: [
									{
										type: 'string',
									},
									{
										type: 'null',
									},
								],
							},
							check_run_id: {
								type: 'number',
							},
							output: {
								type: 'object',
								properties: {
									actions: {
										type: 'array',
										items: {
											type: 'object',
											properties: {
												label: {
													type: 'string',
												},
												identifier: {
													type: 'string',
												},
												description: {
													type: 'string',
												},
											},
										},
									},
								},
							},
							check_suite: {
								type: 'object',
								properties: {
									id: {
										type: 'number',
									},
									pull_requests: {
										type: 'array',
										items: {
											type: 'string',
										},
									},
								},
								deployment: {
									type: 'object',
								},
							},
						},
					},
				},
				required: ['data', 'name'],
			},
			slices: ['properties.data.properties.status'],
			indexed_fields: [['data.status']],
		},
	});
}
