/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

import { GitHubIntegration } from '../../../lib/integrations/github';

const context = {
	id: 'jellyfish-plugin-github-test',
};

describe('isEventValid()', () => {
	test('should return false given no signature header', async () => {
		const result = GitHubIntegration.isEventValid(
			{
				api: 'xxxxx',
				signature: 'secret',
			},
			'....',
			{},
			context,
		);
		expect(result).toBe(false);
	});

	test('should return false given a signature but no key', async () => {
		const result = GitHubIntegration.isEventValid(
			null,
			'....',
			{ 'x-hub-signature': 'sha1=aaaabbbbcccc' },
			context,
		);
		expect(result).toBe(false);
	});

	test('should return false given a signature mismatch', async () => {
		const result = GitHubIntegration.isEventValid(
			{
				api: 'xxxxx',
				signature: 'secret',
			},
			'{"foo":"bar"}',
			{ 'x-hub-signature': 'sha1=foobarbaz' },
			context,
		);
		expect(result).toBe(false);
	});

	test('should return true given a signature match', async () => {
		const result = GitHubIntegration.isEventValid(
			{
				api: 'xxxxx',
				signature: 'secret',
			},
			'{"foo":"bar"}',
			{ 'x-hub-signature': 'sha1=52b582138706ac0c597c315cfc1a1bf177408a4d' },
			context,
		);
		expect(result).toBe(true);
	});
});
