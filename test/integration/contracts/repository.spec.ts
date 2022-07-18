import { testUtils as coreTestUtils } from 'autumndb';
import { defaultPlugin } from '@balena/jellyfish-plugin-default';
import _ from 'lodash';
import { githubPlugin, RepositoryContract, testUtils } from '../../../lib';

let ctx: testUtils.TestContext;
let user: any = {};
let session: any = {};

beforeAll(async () => {
	ctx = await testUtils.newContext({
		plugins: [defaultPlugin(), githubPlugin()],
	});

	// Prepare test user and session
	user = await ctx.createUser(coreTestUtils.generateRandomId());
	session = await ctx.createSession(user);
});

afterAll(() => {
	return testUtils.destroyContext(ctx);
});

test('Should materialize the linked loop', async () => {
	const repository = await ctx.createContract(
		user.id,
		session.id,
		'repository@1.0.0',
		'test repo',
		{},
	);

	const loop = await ctx.kernel.getContractBySlug(
		ctx.logContext,
		ctx.session,
		'loop-product-os@1.0.0',
	);

	await ctx.createLinkThroughWorker(
		user.id,
		session.id,
		repository,
		loop!,
		'is used by',
		'has',
	);

	await ctx.flushAll(ctx.session);

	const result = await ctx.kernel.getContractById<RepositoryContract>(
		ctx.logContext,
		ctx.session,
		repository.id,
	);

	expect(result).not.toBeNull();

	expect(result!.data.is_used_by).toBe(loop!.id);
});
