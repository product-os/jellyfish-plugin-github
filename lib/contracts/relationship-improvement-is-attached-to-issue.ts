import type { RelationshipContractDefinition } from 'autumndb';

export const relationshipImprovementIsAttachedToIssue: RelationshipContractDefinition =
	{
		slug: 'relationship-improvement-is-attached-to-issue',
		type: 'relationship@1.0.0',
		name: 'is attached to',
		data: {
			inverseName: 'has attached',
			title: 'GitHub issue',
			inverseTitle: 'Improvement',
			from: {
				type: 'improvement',
			},
			to: {
				type: 'issue',
			},
		},
	};
