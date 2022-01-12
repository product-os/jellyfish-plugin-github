import type { ContractDefinition } from '@balena/jellyfish-types/build/core';

export default function ({
	mixin,
	withEvents,
}: {
	mixin: any;
	withEvents?: any;
}): ContractDefinition {
	return mixin(withEvents)({
		slug: 'commit',
		name: 'Commit',
		type: 'type@1.0.0',
		data: {
			schema: {
				type: 'object',
				required: ['data', 'name'],
				properties: {
					name: {
						type: 'string',
						fullTextSearch: true,
					},
					data: {
						required: ['org', 'repo', 'head'],
						type: 'object',
						properties: {
							org: {
								type: 'string',
							},
							repo: {
								type: 'string',
							},
							head: {
								type: 'object',
								required: ['sha', 'branch'],
								properties: {
									sha: {
										type: 'string',
									},
									branch: {
										type: 'string',
									},
								},
							},
							$transformer: {
								type: 'object',
								properties: {
									artifactReady: {
										type: 'boolean',
									},
									mergeable: {
										description: 'all downstream contracts are mergeable',
										type: 'string',
										$$formula:
											'contract.links["was built into"].length <= 0 ? "pending" : ' +
											'![true, false].includes(contract.links["was built into"][0].data.$transformer.mergeable) ? ' +
											'contract.links["was built into"][0].data.$transformer.mergeable : ' +
											'contract.links["was built into"][0].data.$transformer.mergeable === true ? "mergeable" : "pending"',
										readOnly: true,
										default: false,
									},
									merged: {
										description: 'PR is merged',
										type: 'boolean',
										$$formula:
											'contract.links["is attached to PR"].length > 0 && ' +
											'contract.links["is attached to PR"][0].data.merged_at && ' +
											'contract.links["is attached to PR"][0].data.head.sha === contract.data.head.sha',
										readOnly: true,
										default: false,
									},
								},
							},
						},
					},
				},
			},
		},
	});
}
