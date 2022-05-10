import type { RelationshipContractDefinition } from 'autumndb';

export const relationshipIssueHasAttachedPattern: RelationshipContractDefinition =
	{
		slug: 'relationship-issue-has-attached-pattern',
		type: 'relationship@1.0.0',
		name: 'has attached',
		data: {
			inverseName: 'is attached to',
			title: 'Pattern',
			inverseTitle: 'GitHub issue',
			from: {
				type: 'issue',
			},
			to: {
				type: 'pattern',
			},
		},
	};
