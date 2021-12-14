import { JellyfishPluginBase } from '@balena/jellyfish-plugin-base';
import { actions } from './actions';
import { cards } from './cards';
import integrations from './integrations';

/**
 * The GitHub Jellyfish plugin.
 */
export class GitHubPlugin extends JellyfishPluginBase {
	constructor() {
		super({
			slug: 'jellyfish-plugin-github',
			name: 'GitHub Plugin',
			version: '1.0.0',
			actions,
			cards,
			integrations,
			requires: [
				{
					slug: 'action-library',
					version: '>=11.x',
				},
				{
					slug: 'jellyfish-plugin-default',
					version: '>=19.x',
				},
			],
		});
	}
}
