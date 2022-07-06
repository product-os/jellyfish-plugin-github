import { contractMixins as workerContractMixins } from '@balena/jellyfish-worker';
import {
	contractMixins as autumndbContractMixins,
	ContractDefinition,
} from 'autumndb';

const slug = 'issue';
const type = 'type@1.0.0';

export const issue: ContractDefinition = workerContractMixins.mixin(
	workerContractMixins.withEvents(slug, type),
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
					mirrors: autumndbContractMixins.uiSchemaDef('mirrors'),
					status: {
						'ui:widget': 'Badge',
					},
					repository: autumndbContractMixins.uiSchemaDef('repository'),
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
			snippet: {
				data: {
					status: {
						'ui:title': null,
						'ui:widget': 'Badge',
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
