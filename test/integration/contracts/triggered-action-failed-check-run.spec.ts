import { testUtils as coreTestUtils } from '@balena/jellyfish-core';
import { defaultPlugin } from '@balena/jellyfish-plugin-default';
import { productOsPlugin } from '@balena/jellyfish-plugin-product-os';
import { githubPlugin, testUtils } from '../../../lib';

let ctx: testUtils.TestContext;
let user: any = {};
let session: any = {};

beforeAll(async () => {
	ctx = await testUtils.newContext({
		plugins: [productOsPlugin(), defaultPlugin(), githubPlugin()],
	});

	user = await ctx.createUser(coreTestUtils.generateRandomId());
	session = await ctx.createSession(user);
});

afterAll(() => {
	return testUtils.destroyContext(ctx);
});

describe('triggered-action-failed-check-run', () => {
	test('commit contract mergeable evaluates to pending when it has no linked contracts', async () => {
		const commit = await ctx.createContract(
			user.id,
			session.id,
			'commit@1.0.0',
			'Test Commit',
			{
				org: '',
				head: {
					sha: '',
					branch: '',
				},
				repo: '',
			},
		);
		await ctx.flushAll(session.id);

		const contract = await ctx.kernel.getContractById(
			ctx.logContext,
			ctx.session,
			commit.id,
		);
		expect((contract?.data as any).$transformer.mergeable).toEqual('pending');
	});

	test('commit contract mergeable evaluates to pending when linked contract has mergeable pending', async () => {
		const commit = await ctx.createContract(
			user.id,
			session.id,
			'commit@1.0.0',
			'Test Commit',
			{
				org: '',
				head: {
					sha: '',
					branch: '',
				},
				repo: '',
			},
		);

		const card = await ctx.createContract(
			user.id,
			session.id,
			'card@1.0.0',
			'Card contract',
			{
				$transformer: {
					mergeable: 'pending',
				},
			},
		);

		await ctx.createLinkThroughWorker(
			user.id,
			session.id,
			commit,
			card,
			'was built into',
			'was built from',
		);

		await ctx.flushAll(session.id);

		const contract = await ctx.kernel.getContractById(
			ctx.logContext,
			ctx.session,
			commit.id,
		);
		expect((contract?.data as any).$transformer.mergeable).toEqual('pending');
	});

	test('commit contract mergeable evaluates to mergeable when linked contract has mergeable mergeable', async () => {
		const commit = await ctx.createContract(
			user.id,
			session.id,
			'commit@1.0.0',
			'Test Commit',
			{
				org: '',
				head: {
					sha: '',
					branch: '',
				},
				repo: '',
			},
		);

		const card = await ctx.createContract(
			user.id,
			session.id,
			'card@1.0.0',
			'Card contract',
			{
				$transformer: {
					mergeable: 'mergeable',
				},
			},
		);

		await ctx.createLinkThroughWorker(
			user.id,
			session.id,
			commit,
			card,
			'was built into',
			'was built from',
		);

		await ctx.flushAll(session.id);

		const contract = await ctx.kernel.getContractById(
			ctx.logContext,
			ctx.session,
			commit.id,
		);
		expect((contract?.data as any).$transformer.mergeable).toEqual('mergeable');
	});

	test('commit contract mergeable evaluates to never when linked contract has mergeable never', async () => {
		const commit = await ctx.createContract(
			user.id,
			session.id,
			'commit@1.0.0',
			'Test Commit',
			{
				org: '',
				head: {
					sha: '',
					branch: '',
				},
				repo: '',
			},
		);

		const card = await ctx.createContract(
			user.id,
			session.id,
			'card@1.0.0',
			'Card contract',
			{
				$transformer: {
					mergeable: 'never',
				},
			},
		);

		await ctx.createLinkThroughWorker(
			user.id,
			session.id,
			commit,
			card,
			'was built into',
			'was built from',
		);

		await ctx.flushAll(session.id);

		const contract = await ctx.kernel.getContractById(
			ctx.logContext,
			ctx.session,
			commit.id,
		);
		expect((contract?.data as any).$transformer.mergeable).toEqual('never');
	});

	test('commit contract mergeable evaluates to mergeable when linked contract has mergeable true', async () => {
		const commit = await ctx.createContract(
			user.id,
			session.id,
			'commit@1.0.0',
			'Test Commit',
			{
				org: '',
				head: {
					sha: '',
					branch: '',
				},
				repo: '',
			},
		);

		const card = await ctx.createContract(
			user.id,
			session.id,
			'card@1.0.0',
			'Card contract',
			{
				$transformer: {
					mergeable: true,
				},
			},
		);

		await ctx.createLinkThroughWorker(
			user.id,
			session.id,
			commit,
			card,
			'was built into',
			'was built from',
		);

		await ctx.flushAll(session.id);

		const contract = await ctx.kernel.getContractById(
			ctx.logContext,
			ctx.session,
			commit.id,
		);
		expect((contract?.data as any).$transformer.mergeable).toEqual('mergeable');
	});

	test('commit contract mergeable evaluates to pending when linked contract has mergeable false', async () => {
		const commit = await ctx.createContract(
			user.id,
			session.id,
			'commit@1.0.0',
			'Test Commit',
			{
				org: '',
				head: {
					sha: '',
					branch: '',
				},
				repo: '',
			},
		);

		const card = await ctx.createContract(
			user.id,
			session.id,
			'card@1.0.0',
			'Card contract',
			{
				$transformer: {
					mergeable: false,
				},
			},
		);

		await ctx.createLinkThroughWorker(
			user.id,
			session.id,
			commit,
			card,
			'was built into',
			'was built from',
		);

		await ctx.flushAll(session.id);

		const contract = await ctx.kernel.getContractById(
			ctx.logContext,
			ctx.session,
			commit.id,
		);
		expect((contract?.data as any).$transformer.mergeable).toEqual('pending');
	});
});
