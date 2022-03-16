import { cardMixins } from 'autumndb';
import type { ContractDefinition } from '@balena/jellyfish-types/build/core';

export const repository: ContractDefinition = {
	slug: 'repository',
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
					git_url: cardMixins.uiSchemaDef('externalUrl'),
					html_url: cardMixins.uiSchemaDef('externalUrl'),
				},
			},
		},
		indexed_fields: [['data.name']],
	},
};
