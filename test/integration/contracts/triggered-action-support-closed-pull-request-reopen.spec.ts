import {
	AutumnDBSession,
	testUtils as coreTestUtils,
	UserContract,
} from 'autumndb';
import { githubPlugin, testUtils } from '../../../lib';

let ctx: testUtils.TestContext;
let user: UserContract;
let session: AutumnDBSession;
let username: string = '';

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

describe('triggered-action-support-closed-pull-request-reopen', () => {
	test('should re-open a closed support thread if an attached issue is closed', async () => {
		const title = `Test Issue ${username}`;
		const pullRequest = await ctx.createContract(
			user.id,
			session,
			'pull-request@1.0.0',
			title,
			{
				status: 'open',
			},
		);

		const supportThread = await ctx.createSupportThread(
			user.id,
			session,
			'test subject',
			{
				status: 'closed',
			},
		);

		await ctx.createLinkThroughWorker(
			user.id,
			session,
			supportThread,
			pullRequest,
			'is attached to',
			'has attached',
		);

		// Update issue status to closed
		await ctx.worker.patchCard(
			ctx.logContext,
			session,
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
		await ctx.flushAll(session);

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
