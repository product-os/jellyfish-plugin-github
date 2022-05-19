import type { RelationshipContractDefinition } from 'autumndb';

export const relationshipPullRequestHasHeadAtRepository: RelationshipContractDefinition =
	{
		slug: 'relationship-pull-request-has-head-at-repository',
		type: 'relationship@1.0.0',
		name: 'has head at',
		data: {
			inverseName: 'is head of',
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
