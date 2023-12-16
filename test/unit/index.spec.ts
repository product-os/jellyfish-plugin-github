import { PluginManager } from '@balena/jellyfish-worker';
import { githubPlugin } from '../../lib';

const pluginManager = new PluginManager([githubPlugin()]);

test('Expected contracts are loaded', () => {
	const contracts = pluginManager.getCards();
	expect(contracts['triggered-action-github-issue-link'].name).toEqual(
		'Triggered action for broadcasting links from a support thread to GitHub issue or pull request',
	);
});
