import type { ContractDefinition } from 'autumndb';

export const triggeredActionIntegrationGitHubSyncOrgFromRepo: ContractDefinition =
	{
		slug: 'triggered-action-integration-github-sync-org-from-repo',
		type: 'triggered-action@1.0.0',
		name: 'Triggered action for syncing GitHub orgs',
		markers: [],
		data: {
			filter: {
				type: 'object',
				properties: {
					tags: {
						type: 'array',
					},
					type: {
						type: 'string',
						const: 'repository@1.0.0',
					},
					data: {
						type: 'object',
					},
				},
			},
			action: 'action-integration-github-sync-org-from-repo@1.0.0',
			target: {
				$eval: 'source.id',
			},
			arguments: {},
		},
	};
