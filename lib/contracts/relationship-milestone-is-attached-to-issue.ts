import type { RelationshipContractDefinition } from 'autumndb';

export const relationshipMilestoneIsAttachedToIssue: RelationshipContractDefinition =
	{
		slug: 'relationship-milestone-is-attached-to-issue',
		type: 'relationship@1.0.0',
		name: 'is attached to',
		data: {
			inverseName: 'has attached',
			title: 'GitHub issue',
			inverseTitle: 'Milestone',
			from: {
				type: 'milestone',
			},
			to: {
				type: 'issue',
			},
		},
	};
