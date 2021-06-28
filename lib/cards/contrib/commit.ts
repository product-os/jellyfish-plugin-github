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
		slug: 'commit',
		name: 'Commit',
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
							org: {
								type: 'string',
							},
							repo: {
								type: 'string',
							},
							head_sha: {
								type: 'string',
							},
							pull_request_title: {
								type: 'string',
							},
							pull_request_url: {
								type: 'string',
							},
							artifact_ready: {
								type: 'boolean',
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
