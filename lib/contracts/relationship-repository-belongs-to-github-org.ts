import type { RelationshipContractDefinition } from 'autumndb';

export const relationshipRepositoryBelongsToGitHubOrg: RelationshipContractDefinition =
	{
		slug: 'relationship-repository-belongs-to-github-org',
		type: 'relationship@1.0.0',
		name: 'belongs to',
		data: {
			inverseName: 'has',
			title: 'Belongs to GitHub org',
			inverseTitle: 'Has Repository',
			from: {
				type: 'repository',
			},
			to: {
				type: 'github-org',
			},
		},
	};
