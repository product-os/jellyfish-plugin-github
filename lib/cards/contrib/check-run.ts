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
								default: 'queued',
							},
							started_at: {
								type: 'string',
								pattern:
									'^\\d{4}-[01]\\d-[0-3]\\dT[0-2]\\d:[0-5]\\d:[0-5]\\d([+-][0-2]\\d:[0-5]\\d|Z)$',
							},
							conclusion: {
								oneOf: [
									{
										type: 'string',
										pattern: [
											'action_required',
											'cancelled',
											'failure',
											'netural',
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
								default: null,
							},
							completed_at: {
								oneOf: [
									{
										type: 'string',
										pattern:
											'^\\d{4}-[01]\\d-[0-3]\\dT[0-2]\\d:[0-5]\\d:[0-5]\\d([+-][0-2]\\d:[0-5]\\d|Z)$',
									},
									{
										type: 'null',
									},
								],
							},
							check_run_id: {
								type: 'string',
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
										type: 'string',
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
