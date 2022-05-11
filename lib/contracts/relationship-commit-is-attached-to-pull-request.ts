import type { RelationshipContractDefinition } from 'autumndb';

export const relationshipCommitIsAttachedToPullRequest: RelationshipContractDefinition =
	{
		slug: 'relationship-commit-is-attached-to-pull-request',
		type: 'relationship@1.0.0',
		name: 'is attached to',
		data: {
			inverseName: 'has attached',
			title: 'Pull Request',
			inverseTitle: 'Commit',
			from: {
				type: 'commit',
			},
			to: {
				type: 'pull-request',
			},
		},
	};
