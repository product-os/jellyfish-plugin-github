import { strict as assert } from 'assert';
import { testUtils as coreTestUtils } from 'autumndb';
import { defaultEnvironment } from '@balena/jellyfish-environment';
import { defaultPlugin } from '@balena/jellyfish-plugin-default';
import { retry } from '@octokit/plugin-retry';
import { Octokit as OctokitRest } from '@octokit/rest';
import _ from 'lodash';
import { v4 as uuid } from 'uuid';
import { githubPlugin, testUtils } from '../../lib';

let ctx: testUtils.TestContext;
let user: any = {};
let session: any = {};
let github: any = {};
let username: string = '';

const [owner, repo] =
	defaultEnvironment.test.integration.github.repo.split('/');
const repository = {
	owner: owner.trim(),
	repo: repo.trim(),
};

beforeAll(async () => {
	ctx = await testUtils.newContext({
		plugins: [defaultPlugin(), githubPlugin()],
	});

	username = coreTestUtils.generateRandomId();
	user = await ctx.createUser(username);
	session = await ctx.createSession(user);

	const Octokit = OctokitRest.plugin(retry);
	github = new Octokit({
		request: {
			retries: 5,
		},
		userAgent: `github-mirror-test-agent (${__dirname})`,
		auth: defaultEnvironment.integration.github.api,
	});
});

afterAll(() => {
	return testUtils.destroyContext(ctx);
});

describe('mirror', () => {
	test('should be able to create an issue with a comment and update the comment after remote deletion', async () => {
		const title = `Test Issue ${username}`;
		const issue = await ctx.createIssue(user.id, session.id, title, {
			repository: `${repository.owner}/${repository.repo}`,
			description: 'Issue body',
			status: 'open',
			archived: false,
		});

		const message: any = await ctx.createMessage(
			user.id,
			session.id,
			issue,
			'First comment',
		);
		const mirror = message.data.mirrors[0];

		await github.issues.deleteComment({
			owner: repository.owner,
			repo: repository.repo,
			comment_id: _.last(_.split(mirror, '-')),
		});

		const updatedMessage = 'Edited message';
		await ctx.worker.patchCard(
			ctx.logContext,
			session.id,
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
		await ctx.flushAll(session.id);

		// Confirm that the contract was updated
		const updated = await ctx.kernel.getContractById(
			ctx.logContext,
			ctx.session,
			message.id,
		);
		assert(updated);
		expect((updated.data.payload as any).message).toEqual(updatedMessage);

		// Check that the remote comment is still deleted
		await ctx.retry(
			() => {
				// TS-TODO: Stop casting
				return github.issues.get({
					owner: repository.owner,
					repo: repository.repo,
					issue_number: _.last((issue.data.mirrors as string[])[0].split('/')),
				});
			},
			(externalIssue: any) => {
				return (
					_.isEqual(externalIssue.data.body, `[${username}] Issue body`) &&
					_.isEqual(externalIssue.data.comments, 0)
				);
			},
		);
	});

	test('should be able to create an issue without comments', async () => {
		const title = `Test Issue: ${coreTestUtils.generateRandomId()}`;
		const issue = await ctx.createIssue(user.id, session.id, title, {
			repository: `${repository.owner}/${repository.repo}`,
			description: 'Issue body',
			status: 'open',
			archived: false,
		});
		// TS-TODO: Stop casting
		const mirror = (issue.data.mirrors as string[])[0];
		await new Promise((resolve) => {
			setTimeout(resolve, 2000);
		});

		const external: any = await github.issues.get({
			owner: repository.owner,
			repo: repository.repo,
			issue_number: _.last(mirror.split('/')),
		});

		const currentUser: any = await github.users.getAuthenticated();
		expect(external.data.user.login).toEqual(currentUser.data.login);
		expect(external.data.state).toEqual('open');
		expect(external.data.title).toEqual(title);
		expect(external.data.body).toEqual(`[${username}] Issue body`);
		expect(external.data.comments).toEqual(0);
		expect(external.data.labels).toEqual([]);
	});

	test('should sync issues given the mirror url if the repository changes', async () => {
		const title = `Test Issue ${uuid()}`;
		const issue = await ctx.createIssue(user.id, session.id, title, {
			repository: `${repository.owner}/${repository.repo}`,
			description: 'Issue body',
			status: 'open',
			archived: false,
		});

		await ctx.worker.patchCard(
			ctx.logContext,
			session.id,
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
					value: `${repository.owner}/${repository.repo}-${uuid()}`,
				},
			],
		);
		await ctx.flushAll(session.id);

		await ctx.createMessage(user.id, session.id, issue, 'First comment');
		// TS-TODO: Stop casting
		const mirror = (issue.data.mirrors as string[])[0];
		const external: any = await github.issues.get({
			owner: repository.owner,
			repo: repository.repo,
			issue_number: _.last(mirror.split('/')),
		});

		const currentUser: any = await github.users.getAuthenticated();
		expect(external.data.user.login).toEqual(currentUser.data.login);
		expect(external.data.state).toEqual('open');
		expect(external.data.title).toEqual(title);
		expect(external.data.body).toEqual(`[${username}] Issue body`);
		expect(external.data.comments).toEqual(1);
		expect(external.data.labels).toEqual([]);
	});

	test('should be able to create an issue with a comment', async () => {
		const title = `Test Issue ${coreTestUtils.generateRandomId()}`;
		const issue = await ctx.createIssue(user.id, session.id, title, {
			repository: `${repository.owner}/${repository.repo}`,
			description: 'Issue body',
			status: 'open',
			archived: false,
		});

		await ctx.createMessage(user.id, session.id, issue, 'First comment');
		// TS-TODO: Stop casting
		const mirror = (issue.data.mirrors as string[])[0];
		const externalIssue: any = await github.issues.get({
			owner: repository.owner,
			repo: repository.repo,
			issue_number: _.last(mirror.split('/')),
		});
		expect(externalIssue.data.body).toEqual(`[${username}] Issue body`);
		expect(externalIssue.data.comments).toEqual(1);

		const externalMessages: any = await github.issues.listComments({
			owner: repository.owner,
			repo: repository.repo,
			issue_number: externalIssue.data.number,
		});
		const currentUser: any = await github.users.getAuthenticated();
		expect(externalMessages.data.length).toEqual(1);
		expect(externalMessages.data[0].body).toEqual(
			`[${username}] First comment`,
		);
		expect(externalMessages.data[0].user.login).toEqual(currentUser.data.login);
	});
});
