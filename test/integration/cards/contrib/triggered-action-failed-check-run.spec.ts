import { ActionLibrary } from '@balena/jellyfish-action-library';
import { DefaultPlugin } from '@balena/jellyfish-plugin-default';
import { ProductOsPlugin } from '@balena/jellyfish-plugin-product-os';
import { integrationHelpers } from '@balena/jellyfish-test-harness';
import _ from 'lodash';
import { GitHubPlugin } from '../../../../lib';

let ctx: integrationHelpers.IntegrationTestContext;
let user: any = {};
let userSession: string = '';
let username: string = '';

beforeAll(async () => {
	ctx = await integrationHelpers.before([
		DefaultPlugin,
		ActionLibrary,
		ProductOsPlugin,
		GitHubPlugin,
	]);

	username = ctx.generateRandomID();
	const createdUser = await ctx.createUser(username);
	user = createdUser.contract;
	userSession = createdUser.session;
});

afterAll(() => {
	return integrationHelpers.after(ctx);
});

test('Commit contract mergeable evaluates to pending when it has no linked contracts', async () => {
	const commit = await ctx.createContract(
		user.id,
		userSession,
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
	await ctx.flushAll(userSession);

	const contract = await ctx.jellyfish.getCardById(
		ctx.context,
		ctx.session,
		commit.id,
	);
	expect((contract?.data as any).$transformer.mergeable).toEqual('pending');
});

test('Commit contract mergeable evaluates to pending when linked contract has mergeable pending', async () => {
	const commit = await ctx.createContract(
		user.id,
		userSession,
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
		userSession,
		'card@1.0.0',
		'Card contract',
		{
			$transformer: {
				mergeable: 'pending',
			},
		},
	);

	await ctx.createLink(
		user.id,
		userSession,
		commit,
		card,
		'was built into',
		'was built from',
	);

	await ctx.flushAll(userSession);

	const contract = await ctx.jellyfish.getCardById(
		ctx.context,
		ctx.session,
		commit.id,
	);
	expect((contract?.data as any).$transformer.mergeable).toEqual('pending');
});

test('Commit contract mergeable evaluates to mergeable when linked contract has mergeable mergeable', async () => {
	const commit = await ctx.createContract(
		user.id,
		userSession,
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
		userSession,
		'card@1.0.0',
		'Card contract',
		{
			$transformer: {
				mergeable: 'mergeable',
			},
		},
	);

	await ctx.createLink(
		user.id,
		userSession,
		commit,
		card,
		'was built into',
		'was built from',
	);

	await ctx.flushAll(userSession);

	const contract = await ctx.jellyfish.getCardById(
		ctx.context,
		ctx.session,
		commit.id,
	);
	expect((contract?.data as any).$transformer.mergeable).toEqual('mergeable');
});

test('Commit contract mergeable evaluates to never when linked contract has mergeable never', async () => {
	const commit = await ctx.createContract(
		user.id,
		userSession,
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
		userSession,
		'card@1.0.0',
		'Card contract',
		{
			$transformer: {
				mergeable: 'never',
			},
		},
	);

	await ctx.createLink(
		user.id,
		userSession,
		commit,
		card,
		'was built into',
		'was built from',
	);

	await ctx.flushAll(userSession);

	const contract = await ctx.jellyfish.getCardById(
		ctx.context,
		ctx.session,
		commit.id,
	);
	expect((contract?.data as any).$transformer.mergeable).toEqual('never');
});

test('Commit contract mergeable evaluates to mergeable when linked contract has mergeable true', async () => {
	const commit = await ctx.createContract(
		user.id,
		userSession,
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
		userSession,
		'card@1.0.0',
		'Card contract',
		{
			$transformer: {
				mergeable: true,
			},
		},
	);

	await ctx.createLink(
		user.id,
		userSession,
		commit,
		card,
		'was built into',
		'was built from',
	);

	await ctx.flushAll(userSession);

	const contract = await ctx.jellyfish.getCardById(
		ctx.context,
		ctx.session,
		commit.id,
	);
	expect((contract?.data as any).$transformer.mergeable).toEqual('mergeable');
});

test('Commit contract mergeable evaluates to pending when linked contract has mergeable false', async () => {
	const commit = await ctx.createContract(
		user.id,
		userSession,
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
		userSession,
		'card@1.0.0',
		'Card contract',
		{
			$transformer: {
				mergeable: false,
			},
		},
	);

	await ctx.createLink(
		user.id,
		userSession,
		commit,
		card,
		'was built into',
		'was built from',
	);

	await ctx.flushAll(userSession);

	const contract = await ctx.jellyfish.getCardById(
		ctx.context,
		ctx.session,
		commit.id,
	);
	expect((contract?.data as any).$transformer.mergeable).toEqual('pending');
});
