import type { ContractDefinition } from '@balena/jellyfish-types/build/core';
import { contractMixins } from 'autumndb';

const slug = 'pull-request';
const type = 'type@1.0.0';

export const pullRequest: ContractDefinition = contractMixins.mixin(
	contractMixins.withEvents(slug, type),
)({
	slug,
	name: 'Pull Request',
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
						description: {
							type: 'string',
							format: 'markdown',
						},
						status: {
							type: 'string',
							default: 'open',
							enum: ['open', 'closed'],
						},
						archived: {
							type: 'boolean',
							default: false,
						},
						head: {
							type: 'object',
							properties: {
								branch: {
									type: 'string',
								},
								sha: {
									type: 'string',
									pattern: '[0-9a-f]{5,40}',
								},
							},
							required: ['branch', 'sha'],
						},
						base: {
							type: 'object',
							properties: {
								branch: {
									type: 'string',
								},
								sha: {
									type: 'string',
									pattern: '^[a-f0-9]{7,40}$',
								},
							},
							required: ['branch', 'sha'],
						},
						created_at: {
							type: ['string', 'null'],
						},
						merged_at: {
							type: ['string', 'null'],
						},
						repository: {
							type: 'string',
							fullTextSearch: true,
						},
						mirrors: {
							type: 'array',
							items: {
								type: 'string',
							},
							fullTextSearch: true,
						},
					},
				},
			},
			required: ['data'],
		},
		uiSchema: {
			fields: {
				data: {
					'ui:order': [
						'repository',
						'description',
						'status',
						'archived',
						'head',
						'base',
						'created_at',
						'merged_at',
					],
					mirrors: contractMixins.uiSchemaDef('mirrors'),
					status: {
						'ui:widget': 'Badge',
					},
					archived: {
						'ui:title': null,
						'ui:widget': 'Badge',
						'ui:value': {
							$if: 'source',
							then: 'Archived',
							else: null,
						},
					},
					repository: contractMixins.uiSchemaDef('repository'),
					base: {
						sha: null,
						branch: {
							'ui:title': null,
							'ui:widget': 'Link',
							'ui:options': {
								href: 'https://github.com/${root.data.repository}/tree/${source}',
							},
						},
					},
					head: {
						'ui:title': null,
						sha: null,
						branch: {
							'ui:title': 'Branch',
							'ui:options': {
								href: 'https://github.com/${root.data.repository}/tree/${source}',
							},
						},
					},
				},
			},
		},
		slices: ['properties.data.properties.status'],
		indexed_fields: [['data.status'], ['data.mirrors']],
	},
});
