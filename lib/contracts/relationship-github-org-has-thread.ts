import type { RelationshipContractDefinition } from 'autumndb';

export const relationshipGitHubOrgHasThread: RelationshipContractDefinition = {
	slug: 'relationship-github-org-has-thread',
	type: 'relationship@1.0.0',
	name: 'has',
	data: {
		inverseName: 'is of',
		title: 'Thread',
		inverseTitle: 'GitHub Org',
		from: {
			type: 'github-org',
		},
		to: {
			type: 'thread',
		},
	},
};
