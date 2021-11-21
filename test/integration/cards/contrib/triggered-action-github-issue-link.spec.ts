import ActionLibrary = require('@balena/jellyfish-action-library');
import { defaultEnvironment } from '@balena/jellyfish-environment';
import { DefaultPlugin } from '@balena/jellyfish-plugin-default';
import { ProductOsPlugin } from '@balena/jellyfish-plugin-product-os';
import { integrationHelpers } from '@balena/jellyfish-test-harness';
import _ from 'lodash';
import { GitHubPlugin } from '../../../../lib';

let ctx: integrationHelpers.IntegrationTestContext;
let user: any = {};
let userSession: string = '';
let username: string = '';

const [owner, repo] =
	defaultEnvironment.test.integration.github.repo.split('/');
const repository = {
	owner: owner.trim(),
	repo: repo.trim(),
};

beforeAll(async () => {
	ctx = await integrationHelpers.before([
		DefaultPlugin,
		ActionLibrary,
		ProductOsPlugin,
		GitHubPlugin,
	]);

	username = ctx.generateRandomID();
	const createdUser = await ctx.createUser(username);
	user = createdUser.contract;
	userSession = createdUser.session;
});

afterAll(() => {
	return integrationHelpers.after(ctx);
});

test('linking a support thread to an issue results in a message on that issues timeline', async () => {
	const title = `Test Issue ${username}`;
	const issue = await ctx.createIssue(user.id, userSession, title, {
		body: 'Issue body',
		status: 'open',
		archived: false,
		description: ctx.generateRandomWords(5),
		repository: `${repository.owner}/${repository.repo}`,
	});

	const supportThread = await ctx.createSupportThread(
		user.id,
		userSession,
		'test subject',
		{
			product: 'test-product',
			inbox: 'S/Paid_Support',
			status: 'open',
		},
	);

	await ctx.createLink(
		user.id,
		userSession,
		supportThread,
		issue,
		'support thread is attached to issue',
		'issue has attached support thread',
	);

	await ctx.waitForMatch({
		type: 'object',
		required: ['type', 'data'],
		properties: {
			type: {
				const: 'message@1.0.0',
			},
			data: {
				type: 'object',
				required: ['payload'],
				properties: {
					payload: {
						type: 'object',
						required: ['message'],
						properties: {
							message: {
								regexp: {
									pattern: 'This issue has attached support thread',
								},
							},
						},
					},
				},
			},
		},
		$$links: {
			'is attached to': {
				type: 'object',
				required: ['id'],
				properties: {
					id: {
						const: issue.id,
					},
				},
			},
		},
	});
});
