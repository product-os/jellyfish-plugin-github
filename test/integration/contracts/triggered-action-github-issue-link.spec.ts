import { testUtils as coreTestUtils } from 'autumndb';
import { defaultEnvironment } from '@balena/jellyfish-environment';
import { defaultPlugin } from '@balena/jellyfish-plugin-default';
import { productOsPlugin } from '@balena/jellyfish-plugin-product-os';
import { githubPlugin, testUtils } from '../../../lib';

let ctx: testUtils.TestContext;
let user: any = {};
let session: any = {};
let username = '';

const [owner, repo] =
	defaultEnvironment.test.integration.github.repo.split('/');
const repository = {
	owner: owner.trim(),
	repo: repo.trim(),
};

beforeAll(async () => {
	ctx = await testUtils.newContext({
		plugins: [productOsPlugin(), defaultPlugin(), githubPlugin()],
	});

	username = coreTestUtils.generateRandomId();
	user = await ctx.createUser(username);
	session = await ctx.createSession(user);
});

afterAll(() => {
	return testUtils.destroyContext(ctx);
});

describe('triggered-action-github-issue-link', () => {
	test('linking a support thread to an issue results in a message on that issues timeline', async () => {
		const title = `Test Issue ${username}`;
		const issue = await ctx.createIssue(user.id, session.id, title, {
			body: 'Issue body',
			status: 'open',
			archived: false,
			description: 'foobar',
			repository: `${repository.owner}/${repository.repo}`,
		});

		const supportThread = await ctx.createSupportThread(
			user.id,
			session.id,
			'test subject',
			{
				product: 'test-product',
				inbox: 'S/Paid_Support',
				status: 'open',
			},
		);

		await ctx.createLinkThroughWorker(
			user.id,
			session.id,
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
});
