import type { RelationshipContractDefinition } from 'autumndb';

export const relationshipGitHubOrgBelongsToLoop: RelationshipContractDefinition =
	{
		slug: 'relationship-github-org-belongs-to-loop',
		type: 'relationship@1.0.0',
		name: 'belongs to',
		data: {
			inverseName: 'has',
			title: 'Belongs to Loop',
			inverseTitle: 'Has GitHub org',
			from: {
				type: 'github-org',
			},
			to: {
				type: 'loop',
			},
		},
	};
