/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

import ActionLibrary from '@balena/jellyfish-action-library';
import { defaultEnvironment } from '@balena/jellyfish-environment';
import { syncIntegrationScenario } from '@balena/jellyfish-test-harness';
import { GitHubPlugin } from '../../lib';
import GitHubIntegration from '../../lib/integrations';
import webhooks from './webhooks/github';

// tslint:disable-next-line: no-var-requires
const DefaultPlugin = require('@balena/jellyfish-plugin-default');

const TOKEN = defaultEnvironment.integration.github;

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
		],
		integration: GitHubIntegration,
		scenarios: webhooks,
		baseUrl: 'https://api.github.com',
		stubRegex: /.*/,
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
