import type { RelationshipContractDefinition } from 'autumndb';

export const relationshipMilestoneIsAttachedToPullRequest: RelationshipContractDefinition =
	{
		slug: 'relationship-milestone-is-attached-to-pull-request',
		type: 'relationship@1.0.0',
		name: 'is attached to',
		data: {
			inverseName: 'has attached',
			title: 'Pull request',
			inverseTitle: 'Milestone',
			from: {
				type: 'milestone',
			},
			to: {
				type: 'pull-request',
			},
		},
	};
