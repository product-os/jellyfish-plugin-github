import type { RelationshipContractDefinition } from 'autumndb';

export const relationshipImprovementIsAttachedToPullRequest: RelationshipContractDefinition =
	{
		slug: 'relationship-improvement-is-attached-to-pull-request',
		type: 'relationship@1.0.0',
		name: 'is attached to',
		data: {
			inverseName: 'has attached',
			title: 'Pull request',
			inverseTitle: 'Improvement',
			from: {
				type: 'improvement',
			},
			to: {
				type: 'pull-request',
			},
		},
	};
