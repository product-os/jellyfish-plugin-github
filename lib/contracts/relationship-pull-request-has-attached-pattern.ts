import type { RelationshipContractDefinition } from 'autumndb';

export const relationshipPullRequestHasAttachedPattern: RelationshipContractDefinition =
	{
		slug: 'relationship-pull-request-has-attached-pattern',
		type: 'relationship@1.0.0',
		name: 'has attached',
		data: {
			inverseName: 'is attached to',
			title: 'Pattern',
			inverseTitle: 'Pull request',
			from: {
				type: 'pull-request',
			},
			to: {
				type: 'pattern',
			},
		},
	};
