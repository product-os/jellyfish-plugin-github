/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

import type { ContractDefinition } from '@balena/jellyfish-types/build/core';

const SLUG = 'repository';

export default function ({
	mixin,
	withRelationships,
	uiSchemaDef,
}: {
	mixin: any;
	withRelationships?: any;
	uiSchemaDef?: any;
}): ContractDefinition {
	return mixin(withRelationships(SLUG, ['thread']))({
		slug: SLUG,
		name: 'Github Repository',
		type: 'type@1.0.0',
		markers: [],
		data: {
			schema: {
				type: 'object',
				properties: {
					name: {
						type: 'string',
						fullTextSearch: true,
					},
					data: {
						type: 'object',
						properties: {
							owner: {
								type: 'string',
							},
							name: {
								type: 'string',
							},
							git_url: {
								type: 'string',
								fullTextSearch: true,
							},
							html_url: {
								type: 'string',
							},
						},
					},
				},
				required: ['data'],
			},
			uiSchema: {
				fields: {
					data: {
						git_url: {
							$ref: uiSchemaDef('externalUrl'),
						},
						html_url: {
							$ref: uiSchemaDef('externalUrl'),
						},
					},
				},
			},
			indexed_fields: [['data.name']],
		},
	});
}
