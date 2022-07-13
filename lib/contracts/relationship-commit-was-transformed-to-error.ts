import type { RelationshipContractDefinition } from 'autumndb';

export const relationshipCommitWasTransformedToError: RelationshipContractDefinition =
	{
		slug: 'relationship-commit-was-transformed-to-error',
		type: 'relationship@1.0.0',
		name: 'was transformed to',
		data: {
			inverseName: 'was transformed from',
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
