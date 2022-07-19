import {
	AutumnDBSession,
	testUtils as coreTestUtils,
	UserContract,
} from 'autumndb';
import _ from 'lodash';
import { githubPlugin, RepositoryContract, testUtils } from '../../../lib';

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
});

afterAll(() => {
	return testUtils.destroyContext(ctx);
});

test('Should materialize the linked loop', async () => {
	const repository = await ctx.createContract(
		user.id,
		session,
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
		session,
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
