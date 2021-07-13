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
						required: ['org', 'repo', 'head'],
						type: 'object',
						properties: {
							org: {
								type: 'string',
							},
							repo: {
								type: 'string',
							},
							head: {
								type: 'object',
								required: ['sha', 'branch'],
								properties: {
									sha: {
										type: 'string',
									},
									branch: {
										type: 'string',
									},
								},
							},
							artifactReady: {
								type: 'boolean',
							},
							mergeable: {
								description: 'all downstream contracts are mergeable',
								type: 'boolean',
								$$formula:
									'this.links["was built into"].length > 0' +
									'&& EVERY(this.links["was built into"], "data.$transformer.mergeable")',
								readOnly: true,
								default: false,
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
