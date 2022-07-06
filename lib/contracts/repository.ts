import { ContractDefinition, contractMixins } from 'autumndb';

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
					git_url: contractMixins.uiSchemaDef('externalUrl'),
					html_url: contractMixins.uiSchemaDef('externalUrl'),
				},
			},
		},
		indexed_fields: [['data.name']],
	},
};
