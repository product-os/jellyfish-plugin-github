import type { RelationshipContractDefinition } from 'autumndb';

export const relationshipSupportThreadIsAttachedToPullRequest: RelationshipContractDefinition =
	{
		slug: 'relationship-support-thread-is-attached-to-pull-request',
		type: 'relationship@1.0.0',
		name: 'is attached to',
		data: {
			inverseName: 'has attached',
			title: 'Pull request',
			inverseTitle: 'Support thread',
			from: {
				type: 'support-thread',
			},
			to: {
				type: 'pull-request',
			},
		},
	};
