import type { RelationshipContractDefinition } from 'autumndb';

export const relationshipMessageIsAttachedToIssue: RelationshipContractDefinition =
	{
		slug: 'relationship-message-is-attached-to-issue',
		type: 'relationship@1.0.0',
		name: 'is attached to',
		data: {
			inverseName: 'has attached element',
			title: 'Message',
			inverseTitle: 'Issue',
			from: {
				type: 'message',
			},
			to: {
				type: 'issue',
			},
		},
	};
