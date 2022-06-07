import type { RelationshipContractDefinition } from 'autumndb';

export const relationshipCommitWasBuiltIntoError: RelationshipContractDefinition =
	{
		slug: 'relationship-commit-was-built-into-error',
		type: 'relationship@1.0.0',
		name: 'was built into',
		data: {
			inverseName: 'was built from',
			title: 'Error',
			inverseTitle: 'Commit',
			from: {
				type: 'commit',
			},
			to: {
				type: 'error',
			},
		},
	};
