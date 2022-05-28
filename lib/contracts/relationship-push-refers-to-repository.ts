import type { RelationshipContractDefinition } from 'autumndb';

export const relationshipPushRefersToRepository: RelationshipContractDefinition =
	{
		slug: 'relationship-gh-push-refers-to-repository',
		type: 'relationship@1.0.0',
		name: 'refers to',
		data: {
			inverseName: 'is referenced by',
			title: 'Push',
			inverseTitle: 'Repository',
			from: {
				type: 'gh-push',
			},
			to: {
				type: 'repository',
			},
		},
	};
