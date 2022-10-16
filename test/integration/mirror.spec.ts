import { strict as assert } from 'assert';
import { testUtils as aTestUtils } from 'autumndb';
import { defaultEnvironment } from '@balena/jellyfish-environment';
import _ from 'lodash';
import nock from 'nock';
import { v4 as uuid } from 'uuid';
import { githubPlugin, testUtils } from '../../lib';

let ctx: testUtils.TestContext;
const [owner, repo] =
	defaultEnvironment.test.integration.github.repo.split('/');

beforeAll(async () => {
	nock.cleanAll();
	ctx = await testUtils.newContext({
		plugins: [githubPlugin()],
	});
});

afterEach(() => {
	nock.cleanAll();
});

afterAll(() => {
	return testUtils.destroyContext(ctx);
});

function getIssue() {
	return {
		url: `https://api.github.com/repos/${owner}/${repo}/issues/3992`,
		html_url: `https://github.com/${owner}/${repo}/issues/3992`,
		id: 1410479065,
		node_id: 'I_kwDOHNb-VM5UEjPZ',
		number: 3992,
		title: 'Test Issue 87a810d2-4b69-4667-a305-70766dbbc596',
		labels: [],
		state: 'open',
		locked: false,
		comments: 0,
		created_at: '2022-10-16T12:49:20Z',
		updated_at: '2022-10-16T12:49:20Z',
		closed_at: null,
		body: '[87a810d2-4b69-4667-a305-70766dbbc596] Issue body',
	};
}

function getComment(id = 1279965737) {
	return {
		url: `https://api.github.com/repos/${owner}/${repo}/issues/comments/${id}`,
		html_url: `https://github.com/${owner}/${repo}/issues/3992#issuecomment-${id}`,
		id,
		created_at: '2022-10-16T13:04:43Z',
		updated_at: '2022-10-16T13:04:43Z',
		body: `[ccea04d2-d3a5-4925-9528-4f20cd033d83] ${uuid()}`,
	};
}

describe('mirror', () => {
	test.only('should sync issues and their comments', async () => {
		const user = await ctx.createUser(
			aTestUtils.generateRandomId().split('-')[0],
		);
		const session = { actor: user };
		nock('https://api.github.com')
			.persist()
			.get('/app/installations')
			.reply(200, [])
			.post(`/repos/${owner}/${repo}/issues`)
			.reply(200, getIssue())
			.get(`/repos/${owner}/${repo}/issues`)
			.reply(200, getIssue())
			.post(`/repos/${owner}/${repo}/issues/3992/comments`)
			.reply(200, getComment())
			.get(`/repos/${owner}/${repo}/issues/3992`)
			.reply(200, getIssue())
			.patch(`/repos/${owner}/${repo}/issues/3992`)
			.reply(200, getIssue())
			.get(`/repos/${owner}/${repo}/issues/comments/1279965737`)
			.reply(200, getComment())
			.patch(`/repos/${owner}/${repo}/issues/comments/1279965737`)
			.reply(200, getComment());

		// Create issue contract, should sync with GitHub
		const issue = await ctx.createIssue(
			user.id,
			session,
			aTestUtils.generateRandomId(),
			{
				repository: `${owner}/${repo}`,
				description: 'Issue body',
				status: 'open',
				archived: false,
			},
		);
		expect(issue.data.mirrors).toEqual([
			`https://github.com/${owner}/${repo}/issues/3992`,
		]);

		// Create message on issue, should sync with GitHub
		const message: any = await ctx.createMessage(
			user.id,
			session,
			issue,
			'First comment',
		);
		expect(message.data.mirrors).toEqual([
			`https://github.com/${owner}/${repo}/issues/3992#issuecomment-1279965737`,
		]);

		// Update message
		const updatedMessage = 'Edited message';
		const updatedComment = getComment();
		updatedComment.body = updatedMessage;
		nock('https://api.github.com')
			.persist()
			.patch(`/repos/${owner}/${repo}/issues/3992/comments`)
			.reply(200, updatedComment)
			.get(`/repos/${owner}/${repo}/issues/3992/comments`)
			.reply(200, updatedComment);
		await ctx.worker.patchCard(
			ctx.logContext,
			session,
			ctx.worker.typeContracts[message.type],
			{
				attachEvents: true,
				actor: user.id,
			},
			message,
			[
				{
					op: 'replace',
					path: '/data/payload/message',
					value: updatedMessage,
				},
			],
		);
		await ctx.flushAll(session);

		// Confirm that the contract was updated
		const updated = await ctx.kernel.getContractById(
			ctx.logContext,
			ctx.session,
			message.id,
		);
		assert(updated);
		expect((updated.data.payload as any).message).toEqual(updatedMessage);

		// Update issue's data.repository value
		const newRepo = `${repo}-${uuid()}`;
		nock('https://api.github.com')
			.persist()
			.get(`/repos/${owner}/${newRepo}/issues/3992`)
			.reply(404)
			.get(`/repos/${owner}/${newRepo}/issues/3992/comments`)
			.reply(404);
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
					path: '/data/repository',
					value: `${owner}/${newRepo}`,
				},
			],
		);
		await ctx.flushAll(session);

		// Create new message on issue
		const newComment = getComment(1279965738);
		nock.cleanAll();
		nock('https://api.github.com')
			.persist()
			.get('/app/installations')
			.reply(200, [])
			.post(`/repos/${owner}/${repo}/issues/3992/comments`)
			.reply(200, newComment)
			.get(`/repos/${owner}/${repo}/issues/comments/${newComment.id}`)
			.reply(200, newComment)
			.patch(`/repos/${owner}/${repo}/issues/comments/${newComment.id}`)
			.reply(200, newComment);
		const newMessage = await ctx.createMessage(
			user.id,
			session,
			issue,
			'Another comment',
		);
		expect(newMessage.data.mirrors).toEqual([
			'https://github.com/product-os-test/jellyfish-test-github/issues/3992#issuecomment-1279965738',
		]);
	});
});
