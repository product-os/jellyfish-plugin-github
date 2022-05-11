import type { RelationshipContractDefinition } from 'autumndb';

export const relationshipRepositoryHasThread: RelationshipContractDefinition = {
	slug: 'relationship-repository-has-thread',
	type: 'relationship@1.0.0',
	name: 'has',
	data: {
		inverseName: 'is of',
		title: 'Thread',
		inverseTitle: 'Repository',
		from: {
			type: 'repository',
		},
		to: {
			type: 'thread',
		},
	},
};
