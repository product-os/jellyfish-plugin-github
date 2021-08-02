/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

import ActionLibrary from '@balena/jellyfish-action-library';
import { defaultEnvironment } from '@balena/jellyfish-environment';
import { DefaultPlugin } from '@balena/jellyfish-plugin-default';
import { syncIntegrationScenario } from '@balena/jellyfish-test-harness';
import jwt from 'jsonwebtoken';
import nock from 'nock';
import { GitHubPlugin } from '../../lib';
import webhooks from './webhooks/github';
import { createGitHubOrg, loopBalenaIo } from './fixtures';

const TOKEN = defaultEnvironment.integration.github;

const testGitHubOrgs = [
	'loop-os',
	'loop-os-staging',
	'Codertocat',
	'resin-io',
	'balena-io',
	'nazrhom',
];

const loadGithubOrgs = async (context) => {
	await context.jellyfish.insertCard(
		context.context,
		context.session,
		loopBalenaIo,
	);
	for (const gitHubOrgName of testGitHubOrgs) {
		await context.jellyfish.insertCard(
			context.context,
			context.session,
			createGitHubOrg(gitHubOrgName),
		);
	}
};

const accessTokenNock = async () => {
	if (TOKEN.api && TOKEN.key) {
		await nock('https://api.github.com')
			.persist()
			.post(/^\/app\/installations\/\d+\/access_tokens$/)
			.reply(function (_uri: string, _request: any, callback: any) {
				const token = this.req.headers.authorization[0].split(' ')[1];
				const privateKey = Buffer.from(TOKEN.key, 'base64').toString();
				jwt.verify(
					token,
					privateKey,
					{
						algorithms: ['RS256'],
					},
					(error) => {
						if (error) {
							return callback(error);
						}

						return callback(null, [
							201,
							{
								token: TOKEN.api,
								expires_at: '2056-07-11T22:14:10Z',
								permissions: {
									issues: 'write',
									contents: 'read',
								},
								repositories: [],
							},
						]);
					},
				);
			});
	}
};

syncIntegrationScenario.run(
	{
		test,
		before: beforeAll,
		beforeEach,
		after: afterAll,
		afterEach,
	},
	{
		basePath: __dirname,
		plugins: [ActionLibrary, DefaultPlugin, GitHubPlugin],
		cards: [
			'issue',
			'pull-request',
			'message',
			'repository',
			'gh-push',
			'check-run',
			'commit',
			'github-org',
		],
		scenarios: webhooks,
		baseUrl: 'https://api.github.com',
		stubRegex: /.*/,
		before: loadGithubOrgs,
		beforeEach: accessTokenNock,
		source: 'github',
		options: {
			token: TOKEN,
		},
		isAuthorized: (self: any, request: any) => {
			return (
				request.headers.authorization &&
				request.headers.authorization[0] === `token ${self.options.token.api}`
			);
		},
	},
);
