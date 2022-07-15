import { testUtils as coreTestUtils } from 'autumndb';
import { defaultEnvironment } from '@balena/jellyfish-environment';
import { defaultPlugin } from '@balena/jellyfish-plugin-default';
import { githubPlugin, testUtils } from '../../../lib';

let ctx: testUtils.TestContext;
let user: any = {};
let session: any = {};
const username: string = '';

const [owner, repo] =
	defaultEnvironment.test.integration.github.repo.split('/');
const repository = {
	owner: owner.trim(),
	repo: repo.trim(),
};

beforeAll(async () => {
	ctx = await testUtils.newContext({
		plugins: [defaultPlugin(), githubPlugin()],
	});

	user = await ctx.createUser(coreTestUtils.generateRandomId());
	session = await ctx.createSession(user);
});

afterAll(() => {
	return testUtils.destroyContext(ctx);
});

describe('triggered-action-support-closed-issue-reopen', () => {
	test('should re-open a closed support thread if an attached issue is closed', async () => {
		const title = `Test Issue ${username}`;
		const issue = await ctx.createIssue(user.id, session.id, title, {
			status: 'open',
			description: 'Foo bar',
			repository: `${repository.owner}/${repository.repo}`,
		});

		const supportThread = await ctx.createSupportThread(
			user.id,
			session.id,
			'test subject',
			{
				product: 'test-product',
				inbox: 'S/Paid_Support',
				status: 'closed',
			},
		);

		await ctx.createLinkThroughWorker(
			user.id,
			session.id,
			supportThread,
			issue,
			'is attached to',
			'has attached',
		);

		// Update issue status to closed
		await ctx.worker.patchCard(
			ctx.logContext,
			session.id,
			ctx.worker.typeContracts[issue.type],
			{
				attachEvents: true,
				actor: user.id,
			},
			issue,
			[
				{
					op: 'replace',
					path: '/data/status',
					value: 'closed',
				},
			],
		);
		await ctx.flushAll(session.id);

		// Wait for the support thread to be re-opened
		await ctx.waitForMatch({
			type: 'object',
			required: ['id', 'data'],
			properties: {
				id: {
					const: supportThread.id,
				},
				data: {
					type: 'object',
					required: ['status'],
					properties: {
						status: {
							const: 'open',
						},
					},
				},
			},
		});
	});
});
