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
const username: string = '';

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

	user = await ctx.createUser(coreTestUtils.generateRandomId());
	session = { actor: user };
});

afterAll(() => {
	return testUtils.destroyContext(ctx);
});

describe('triggered-action-support-closed-issue-reopen', () => {
	test('should re-open a closed support thread if an attached issue is closed', async () => {
		const title = `Test Issue ${username}`;
		const issue = await ctx.createIssue(user.id, session, title, {
			status: 'open',
			description: 'Foo bar',
			repository: `${repository.owner}/${repository.repo}`,
		});

		const supportThread = await ctx.createSupportThread(
			user.id,
			session,
			'test subject',
			{
				product: 'test-product',
				inbox: 'S/Paid_Support',
				status: 'closed',
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

		// Update issue status to closed
		await ctx.worker.patchCard(
			ctx.logContext,
			session,
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
