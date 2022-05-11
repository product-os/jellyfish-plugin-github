import type { RelationshipContractDefinition } from 'autumndb';

export const relationshipSupportThreadIsAttachedToIssue: RelationshipContractDefinition =
	{
		slug: 'relationship-support-thread-is-attached-to-issue',
		type: 'relationship@1.0.0',
		name: 'is attached to',
		data: {
			inverseName: 'has attached',
			title: 'GitHub issue',
			inverseTitle: 'Support thread',
			from: {
				type: 'support-thread',
			},
			to: {
				type: 'issue',
			},
		},
	};
