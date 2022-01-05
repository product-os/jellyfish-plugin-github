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

test('should re-open a closed support thread if an attached issue is closed', async () => {
	const title = `Test Issue ${username}`;
	const pullRequest = await ctx.createContract(
		user.id,
		userSession,
		'pull-request@1.0.0',
		title,
		{
			status: 'open',
		},
	);

	const supportThread = await ctx.createSupportThread(
		user.id,
		userSession,
		'test subject',
		{
			status: 'closed',
		},
	);

	await ctx.createLink(
		user.id,
		userSession,
		supportThread,
		pullRequest,
		'support thread is attached to pull request',
		'pull request has attached support thread',
	);

	// Update issue status to closed
	await ctx.worker.patchCard(
		ctx.context,
		userSession,
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
	await ctx.flushAll(userSession);

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
