import type { RelationshipContractDefinition } from 'autumndb';

export const relationshipRepositoryUsesRepository: RelationshipContractDefinition =
	{
		slug: 'relationship-repository-uses-repository',
		type: 'relationship@1.0.0',
		name: 'uses',
		data: {
			inverseName: 'is used by',
			title: 'Uses product',
			inverseTitle: 'Used by product',
			from: {
				type: 'repository',
			},
			to: {
				type: 'repository',
			},
		},
	};
