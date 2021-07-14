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
		slug: 'gh-app-installation',
		name: 'GitHub App Installation',
		type: 'type@1.0.0',
		data: {
			schema: {
				type: 'object',
				required: ['data'],
				properties: {
					data: {
						required: ['app_id', 'installation_id', 'org'],
						type: 'object',
						properties: {
							app_id: {
								type: 'number',
							},
							installation_id: {
								type: 'number',
							},
							org: {
								type: 'string',
							},
						},
					},
				},
			},
			indexed_fields: [['data.app_id'], ['data.org']],
		},
	});
}
