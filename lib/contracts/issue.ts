import { cardMixins } from '@balena/jellyfish-core';
import type { ContractDefinition } from '@balena/jellyfish-types/build/core';

const slug = 'issue';
const type = 'type@1.0.0';

export const issue: ContractDefinition = cardMixins.mixin(
	cardMixins.withEvents(slug, type),
)({
	slug,
	name: 'GitHub Issue',
	type,
	data: {
		schema: {
			type: 'object',
			properties: {
				name: {
					type: 'string',
					pattern: '^.*\\S.*$',
					fullTextSearch: true,
				},
				data: {
					type: 'object',
					properties: {
						repository: {
							type: 'string',
						},
						mirrors: {
							type: 'array',
							items: {
								type: 'string',
							},
							fullTextSearch: true,
						},
						description: {
							type: 'string',
							format: 'markdown',
						},
						status: {
							title: 'Status',
							type: 'string',
							default: 'open',
							enum: ['open', 'closed'],
						},
						archived: {
							type: 'boolean',
							default: false,
						},
					},
					required: ['repository'],
				},
			},
			required: ['data'],
		},
		uiSchema: {
			fields: {
				data: {
					'ui:order': [
						'repository',
						'mirrors',
						'description',
						'status',
						'archived',
					],
					mirrors: cardMixins.uiSchemaDef('mirrors'),
					status: {
						'ui:widget': 'Badge',
					},
					repository: cardMixins.uiSchemaDef('repository'),
					archived: {
						'ui:title': null,
						'ui:widget': 'Badge',
						'ui:value': {
							$if: 'source',
							then: 'Archived',
							else: null,
						},
					},
				},
			},
			edit: {
				$ref: '#/data/uiSchema/definitions/form',
			},
			create: {
				$ref: '#/data/uiSchema/edit',
			},
			definitions: {
				form: {
					data: {
						repository: {
							'ui:widget': 'AutoCompleteWidget',
							'ui:options': {
								resource: 'issue',
								keyPath: 'data.repository',
							},
						},
					},
				},
			},
		},
		slices: ['properties.data.properties.status'],
		indexed_fields: [['data.mirrors']],
	},
});
