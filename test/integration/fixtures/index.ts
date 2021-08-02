/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

export { default as loopBalenaIo } from './loop-balena-io.json';

export const createGitHubOrg = (name, loop = 'loop-balena-io@1.0.0') => {
	return {
		data: {
			mirrors: [`https://github.com/${name}`],
		},
		loop,
		name: `github org ${name}`,
		slug: `github-org-${name}`,
		type: 'github-org@1.0.0',
		version: '1.0.0',
	};
};
