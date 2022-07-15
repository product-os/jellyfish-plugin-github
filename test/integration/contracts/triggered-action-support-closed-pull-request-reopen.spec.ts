import { testUtils as coreTestUtils } from 'autumndb';
import { defaultPlugin } from '@balena/jellyfish-plugin-default';
import { githubPlugin, testUtils } from '../../../lib';

let ctx: testUtils.TestContext;
let user: any = {};
let session: any = {};
let username: string = '';

beforeAll(async () => {
	ctx = await testUtils.newContext({
		plugins: [defaultPlugin(), githubPlugin()],
	});

	username = coreTestUtils.generateRandomId();
	user = await ctx.createUser(username);
	session = await ctx.createSession(user);
});

afterAll(() => {
	return testUtils.destroyContext(ctx);
});

describe('triggered-action-support-closed-pull-request-reopen', () => {
	test('should re-open a closed support thread if an attached issue is closed', async () => {
		const title = `Test Issue ${username}`;
		const pullRequest = await ctx.createContract(
			user.id,
			session.id,
			'pull-request@1.0.0',
			title,
			{
				status: 'open',
			},
		);

		const supportThread = await ctx.createSupportThread(
			user.id,
			session.id,
			'test subject',
			{
				status: 'closed',
			},
		);

		await ctx.createLinkThroughWorker(
			user.id,
			session.id,
			supportThread,
			pullRequest,
			'is attached to',
			'has attached',
		);

		// Update issue status to closed
		await ctx.worker.patchCard(
			ctx.logContext,
			session.id,
			ctx.worker.typeContracts[pullRequest.type],
			{
				attachEvents: true,
				actor: user.id,
			},
			pullRequest,
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
