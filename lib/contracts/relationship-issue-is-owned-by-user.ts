import type { RelationshipContractDefinition } from 'autumndb';

export const relationshipIssueIsOwnedByUser: RelationshipContractDefinition = {
	slug: 'relationship-issue-is-owned-by-user',
	type: 'relationship@1.0.0',
	name: 'is owned by',
	data: {
		inverseName: 'is owner of',
		title: 'Owner',
		inverseTitle: 'Owned issue',
		from: {
			type: 'issue',
		},
		to: {
			type: 'user',
		},
	},
};
