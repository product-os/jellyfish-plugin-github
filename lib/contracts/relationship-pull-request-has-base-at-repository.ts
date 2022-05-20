import type { RelationshipContractDefinition } from 'autumndb';

export const relationshipPullRequestHasBaseAtRepository: RelationshipContractDefinition =
	{
		slug: 'relationship-pull-request-has-head-at-repository',
		type: 'relationship@1.0.0',
		name: 'has base at',
		data: {
			inverseName: 'is base of',
			title: 'Repository',
			inverseTitle: 'Pull request',
			from: {
				type: 'pull-request',
			},
			to: {
				type: 'repository',
			},
		},
	};
