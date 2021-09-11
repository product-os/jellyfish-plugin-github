/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

import ActionLibrary = require('@balena/jellyfish-action-library');
import { defaultEnvironment } from '@balena/jellyfish-environment';
import { DefaultPlugin } from '@balena/jellyfish-plugin-default';
import { ProductOsPlugin } from '@balena/jellyfish-plugin-product-os';
import { integrationHelpers } from '@balena/jellyfish-test-harness';
import { Contract } from '@balena/jellyfish-types/build/core';
import Bluebird from 'bluebird';
import _ from 'lodash';
import { v4 as uuid } from 'uuid';
import { GitHubPlugin } from '../../lib';
import { strict as assert } from 'assert';
import { retry } from '@octokit/plugin-retry';
import { Octokit as OctokitRest } from '@octokit/rest';

let ctx: integrationHelpers.IntegrationTestContext;
let user: any = {};
let userSession: string = '';
let github: any = {};
let username: string = '';

const [owner, repo] =
	defaultEnvironment.test.integration.github.repo.split('/');
const repository = {
	owner: owner.trim(),
	repo: repo.trim(),
};

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
	return integrationHelpers.after(ctx);
});

async function createIssue(title: string, options: any): Promise<Contract> {
	const inserted = await ctx.worker.insertCard(
		ctx.context,
		userSession,
		ctx.worker.typeContracts['issue@1.0.0'],
		{
			attachEvents: true,
			actor: user.id,
		},
		{
			name: title,
			slug: ctx.generateRandomSlug({
				prefix: 'issue',
			}),
			version: '1.0.0',
			data: {
				repository: `${repository.owner}/${repository.repo}`,
				description: options.body,
				status: options.status,
				archived: options.archived,
			},
		},
	);
	assert(inserted);
	await ctx.flushAll(userSession);

	const issue = await ctx.jellyfish.getCardById(
		ctx.context,
		ctx.session,
		inserted.id,
	);
	assert(issue);
	return issue;
}

test('should be able to create an issue with a comment and update the comment after remote deletion', async () => {
	const title = `Test Issue ${username}`;
	const issue: any = await createIssue(title, {
		body: 'Issue body',
		status: 'open',
		archived: false,
	});

	const message: any = await ctx.createMessage(
		user.id,
		userSession,
		issue,
		'First comment',
	);
	const mirror = message.data.mirrors[0];

	await github.issues.deleteComment({
		owner: repository.owner,
		repo: repository.repo,
		comment_id: _.last(_.split(mirror, '-')),
	});

	await ctx.worker.patchCard(
		ctx.context,
		userSession,
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
				value: 'Edited message',
			},
		],
	);
	await ctx.flushAll(userSession);

	await ctx.retry(
		() => {
			return github.issues.get({
				owner: repository.owner,
				repo: repository.repo,
				issue_number: _.last(issue.data.mirrors[0].split('/')),
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
	const title = `Test Issue: ${ctx.generateRandomWords(3)}`;
	const issue: any = await createIssue(title, {
		body: 'Issue body',
		status: 'open',
		archived: false,
	});
	const mirror = issue.data.mirrors[0];
	await Bluebird.delay(2000);

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
	const issue: any = await createIssue(title, {
		body: 'Issue body',
		status: 'open',
		archived: false,
	});

	await ctx.worker.patchCard(
		ctx.context,
		userSession,
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
	await ctx.flushAll(userSession);

	await ctx.createMessage(user.id, userSession, issue, 'First comment');
	const mirror = issue.data.mirrors[0];
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
	const title = `Test Issue ${uuid()}`;
	const issue: any = await createIssue(title, {
		body: 'Issue body',
		status: 'open',
		archived: false,
	});

	await ctx.createMessage(user.id, userSession, issue, 'First comment');
	const mirror = issue.data.mirrors[0];
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
	expect(externalMessages.data[0].body).toEqual(`[${username}] First comment`);
	expect(externalMessages.data[0].user.login).toEqual(currentUser.data.login);
});
