/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

// tslint:disable: no-var-requires
import { GitHubPlugin } from '../../lib';

// TS-TODO: Update import after core is converted to TypeScript
import { cardMixins as coreMixins } from '@balena/jellyfish-core';

const context = {
	id: 'jellyfish-plugin-github-test',
};

const plugin = new GitHubPlugin();

test('Expected cards are loaded', () => {
	const cards = plugin.getCards(context, coreMixins);

	// Sanity check
	expect(cards['triggered-action-github-issue-link'].name).toEqual(
		'Triggered action for broadcasting links from a support thread to GitHub issue or pull request',
	);
	expect(
		cards['triggered-action-integration-github-mirror-event'].name,
	).toEqual('Triggered action for GitHub mirrors');
});

test('Expected integrations are loaded', () => {
	const integrations = plugin.getSyncIntegrations(context);

	// Sanity check
	expect(integrations.github.slug).toEqual('github');
});
