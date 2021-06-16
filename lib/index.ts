/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

import { JellyfishPluginBase } from '@balena/jellyfish-plugin-base';
import actions from './actions';
import cards from './cards';
import { integrations } from './integrations';

// TS-TODO: Update import after core is converted to TypeScript
// tslint:disable: no-var-requires
const defaultPluginMixins = require('@balena/jellyfish-plugin-default/lib/cards/mixins');

/**
 * The GitHub Jellyfish plugin.
 */
export class GitHubPlugin extends JellyfishPluginBase {
	constructor() {
		super({
			slug: 'jellyfish-plugin-github',
			name: 'GitHub Plugin',
			version: '1.0.1',
			actions,
			cards,
			mixins: defaultPluginMixins,
			integrations,
			requires: [
				{
					slug: 'action-library',
					version: '>=11.x',
				},
				{
					slug: 'jellyfish-plugin-default',
					version: '>=10.x',
				},
			],
		});
	}
}
