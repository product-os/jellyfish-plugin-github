import {
	AutumnDBSession,
	testUtils as coreTestUtils,
	UserContract,
} from 'autumndb';
import { githubPlugin, testUtils } from '../../../lib';

let ctx: testUtils.TestContext;
let user: UserContract;
let session: AutumnDBSession;

beforeAll(async () => {
	ctx = await testUtils.newContext({
		plugins: [githubPlugin()],
	});

	// Prepare test user and session
	user = await ctx.createUser(coreTestUtils.generateRandomId());
	session = { actor: user };

	// Add relationship for tests
	await ctx.worker.insertCard(
		ctx.logContext,
		ctx.session,
		ctx.worker.typeContracts['relationship@1.0.0'],
		{
			attachEvents: false,
		},
		{
			slug: 'relationship-commit-was-trasformed-to-card',
			type: 'relationship@1.0.0',
			name: 'was transformed to',
			data: {
				inverseName: 'was transformed from',
				title: 'Commit',
				inverseTitle: 'Card',
				from: {
					type: 'commit',
				},
				to: {
					type: 'card',
				},
			},
		},
	);
});

afterAll(() => {
	return testUtils.destroyContext(ctx);
});

describe('triggered-action-failed-check-run', () => {
	test('commit contract mergeable evaluates to pending when it has no linked contracts', async () => {
		const commit = await ctx.createContract(
			user.id,
			session,
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
		await ctx.flushAll(session);

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
			session,
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
			session,
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
			session,
			commit,
			card,
			'was transformed to',
			'was transformed from',
		);

		await ctx.flushAll(session);

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
			session,
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
			session,
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
			session,
			commit,
			card,
			'was transformed to',
			'was transformed from',
		);

		await ctx.flushAll(session);

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
			session,
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
			session,
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
			session,
			commit,
			card,
			'was transformed to',
			'was transformed from',
		);

		await ctx.flushAll(session);

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
			session,
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
			session,
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
			session,
			commit,
			card,
			'was transformed to',
			'was transformed from',
		);

		await ctx.flushAll(session);

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
			session,
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
			session,
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
			session,
			commit,
			card,
			'was transformed to',
			'was transformed from',
		);

		await ctx.flushAll(session);

		const contract = await ctx.kernel.getContractById(
			ctx.logContext,
			ctx.session,
			commit.id,
		);
		expect((contract?.data as any).$transformer.mergeable).toEqual('pending');
	});
});
