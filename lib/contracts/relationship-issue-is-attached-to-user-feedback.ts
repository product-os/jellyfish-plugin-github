import type { RelationshipContractDefinition } from 'autumndb';

export const relationshipIssueIsAttachedToUserFeedback: RelationshipContractDefinition =
	{
		slug: 'relationship-issue-is-attached-to-user-feedback',
		type: 'relationship@1.0.0',
		name: 'is attached to',
		data: {
			inverseName: 'has attached',
			title: 'User feedback',
			inverseTitle: 'GitHub issue',
			from: {
				type: 'issue',
			},
			to: {
				type: 'user-feedback',
			},
		},
	};
