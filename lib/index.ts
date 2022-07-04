import type { PluginDefinition } from '@balena/jellyfish-worker';
import { actions } from './actions';
import { contracts } from './contracts';
import { integrations } from './integrations';
export * as testUtils from './test-utils';
export * from './types';

// tslint:disable-next-line: no-var-requires
const { version } = require('../package.json');

/**
 * The GitHub Jellyfish plugin.
 */
export const githubPlugin = (): PluginDefinition => {
	return {
		slug: 'plugin-github',
		name: 'GitHub Plugin',
		version,
		actions,
		contracts,
		integrationMap: integrations,
		requires: [
			{
				slug: 'plugin-default',
				version: '>=23.x',
			},
		],
	};
};
