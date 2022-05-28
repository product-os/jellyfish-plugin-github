import type { RelationshipContractDefinition } from 'autumndb';

export const relationshipMessageIsAttachedToPullRequest: RelationshipContractDefinition =
	{
		slug: 'relationship-message-is-attached-to-pull-request',
		type: 'relationship@1.0.0',
		name: 'is attached to',
		data: {
			inverseName: 'has attached element',
			title: 'Message',
			inverseTitle: 'Pull Request',
			from: {
				type: 'message',
			},
			to: {
				type: 'pull-request',
			},
		},
	};
