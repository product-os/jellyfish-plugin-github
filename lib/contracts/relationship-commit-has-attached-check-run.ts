import type { RelationshipContractDefinition } from 'autumndb';

export const relationshipCommitHasAttachedCheckRun: RelationshipContractDefinition =
	{
		slug: 'relationship-commit-has-attached-check-run',
		type: 'relationship@1.0.0',
		name: 'has attached',
		data: {
			inverseName: 'is attached to',
			title: 'Check Run',
			inverseTitle: 'Commit',
			from: {
				type: 'commit',
			},
			to: {
				type: 'check-run',
			},
		},
	};
