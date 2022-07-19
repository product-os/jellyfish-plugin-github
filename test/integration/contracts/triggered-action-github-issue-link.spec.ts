import {
	AutumnDBSession,
	testUtils as coreTestUtils,
	UserContract,
} from 'autumndb';
import { defaultEnvironment } from '@balena/jellyfish-environment';
import { githubPlugin, testUtils } from '../../../lib';

let ctx: testUtils.TestContext;
let user: UserContract;
let session: AutumnDBSession;
let username = '';

const [owner, repo] =
	defaultEnvironment.test.integration.github.repo.split('/');
const repository = {
	owner: owner.trim(),
	repo: repo.trim(),
};

beforeAll(async () => {
	ctx = await testUtils.newContext({
		plugins: [githubPlugin()],
	});

	username = coreTestUtils.generateRandomId();
	user = await ctx.createUser(username);
	session = { actor: user };
});

afterAll(() => {
	return testUtils.destroyContext(ctx);
});

describe('triggered-action-github-issue-link', () => {
	test('linking a support thread to an issue results in a message on that issues timeline', async () => {
		const title = `Test Issue ${username}`;
		const issue = await ctx.createIssue(user.id, session, title, {
			body: 'Issue body',
			status: 'open',
			archived: false,
			description: 'foobar',
			repository: `${repository.owner}/${repository.repo}`,
		});

		const supportThread = await ctx.createSupportThread(
			user.id,
			session,
			'test subject',
			{
				product: 'test-product',
				inbox: 'S/Paid_Support',
				status: 'open',
			},
		);

		await ctx.createLinkThroughWorker(
			user.id,
			session,
			supportThread,
			issue,
			'is attached to',
			'has attached',
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
										pattern: '^This has attached',
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
