import type { RelationshipContractDefinition } from 'autumndb';

export const relationshipSalesThreadIsAttachedToIssue: RelationshipContractDefinition =
	{
		slug: 'relationship-sales-thread-is-attached-to-issue',
		type: 'relationship@1.0.0',
		name: 'is attached to',
		data: {
			inverseName: 'has attached',
			title: 'GitHub issue',
			inverseTitle: 'Sales thread',
			from: {
				type: 'sales-thread',
			},
			to: {
				type: 'issue',
			},
		},
	};
