import type { PluginDefinition } from '@balena/jellyfish-worker';
import { contracts } from './contracts';
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
		contracts,
	};
};
