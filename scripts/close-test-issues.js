#!/usr/bin/env node

/* eslint-disable id-length */

/*
 * This script looks through a GitHub repository and closes issues that were created two or more days ago.
 * Usage: INTEGRATION_GITHUB_TOKEN=<...> ./scripts/close-test-issues.js
 */

const _ = require('lodash');
const { throttling } = require('@octokit/plugin-throttling');
const { retry } = require('@octokit/plugin-retry');
const Octokit = require('@octokit/rest').Octokit.plugin(retry, throttling);
const environment = require('@balena/jellyfish-environment').defaultEnvironment;

const sub = require('date-fns/sub');
const formatISO = require('date-fns/formatISO');

const TOKEN = environment.integration.github.api;
const REPO = environment.test.integration.github.repo;
const DELAY = 500;
const RETRY_COUNT = 5;
const SINCE = formatISO(
	sub(new Date(), {
		days: 1,
	}),
	{
		representation: 'date',
	},
);

/**
 * @summary Close old GitHub issues in the Jellyfish test repository
 * @function
 *
 * @returns {Promise<Number>} number of issues closed
 */
const closeIssues = async () => {
	const octokit = new Octokit({
		request: {
			retries: RETRY_COUNT,
		},
		userAgent: 'clean-script-user-agent',
		auth: `token ${TOKEN}`,
		throttle: {
			onRateLimit: (_retryAfter, retryOptions) => {
				return retryOptions.request.RETRY_COUNT <= RETRY_COUNT;
			},
			onAbuseLimit: (_retryAfter, retryOptions) => {
				return retryOptions.request.RETRY_COUNT <= RETRY_COUNT;
			},
		},
	});

	const context = {
		closed: [],
		owner: REPO.split('/')[0],
		repo: REPO.split('/')[1],
		octokit,
	};

	// Search for old issues.
	const query = `repo:${REPO}+is:issue+is:open+created:<${SINCE}`;

	while (true) {
		// Search for old test issues.
		const results = await context.octokit.search.issuesAndPullRequests({
			q: query,
			per_page: 100,
		});

		// Break loop if no issues were found.
		if (!_.get(results, ['data', 'items', 'length'])) {
			break;
		}

		await Promise.all(
			results.data.items.map(async (issue) => {
				await closeIssue(context, issue);
				context.closed.push(issue.number);
				await new Promise((resolve) => {
					setTimeout(resolve, DELAY);
				});
			}),
		);
	}

	return context.closed.length;
};

/**
 * @summary Close a single GitHub issue
 * @function
 *
 * @param {Object} context - Data/objects needed to call GitHub API
 * @param {Object} issue - Title and number of an issue to close
 */
const closeIssue = async (context, issue) => {
	if (_.includes(context.closed, issue.number)) {
		return;
	}
	await context.octokit.issues.update({
		owner: context.owner,
		repo: context.repo,
		issue_number: issue.number,
		state: 'closed',
	});
};

// Check that the required environment variables were set.
if (_.isEmpty(TOKEN)) {
	throw new Error('Must set INTEGRATION_GITHUB_TOKEN');
}
if (_.isEmpty(REPO)) {
	throw new Error('Must set TEST_INTEGRATION_GITHUB_REPO');
}

// Close old test issues.
closeIssues()
	.then((total) => {
		console.log(`Closed ${total} issues`);
	})
	.catch((err) => {
		console.error(err);
	});
