import type { RelationshipContractDefinition } from 'autumndb';

export const relationshipLoopHasRepository: RelationshipContractDefinition = {
	slug: 'relationship-loop-has-repository',
	type: 'relationship@1.0.0',
	name: 'has',
	data: {
		inverseName: 'is used by',
		title: 'Products',
		inverseTitle: 'Loop',
		from: {
			type: 'loop',
		},
		to: {
			type: 'repository',
		},
	},
};
