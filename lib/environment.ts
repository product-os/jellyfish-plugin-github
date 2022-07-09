import _ from 'lodash';

interface Environment {
	api: string;
	signature: string;
	key: string;
	appId: number;
	test: {
		repo: string;
	};
}

function getPrivateKey(): string | undefined {
	const raw = process.env['INTEGRATION_GITHUB_PRIVATE_KEY'];
	if (raw) {
		return Buffer.from(raw.replace(/\\n/gm, '\n'), 'base64').toString();
	}
	return undefined;
}

function getAppId(): number | undefined {
	const raw = process.env['INTEGRATION_GITHUB_APP_ID'];
	if (raw) {
		return _.parseInt(raw);
	}
	return undefined;
}

export const defaults: Environment = {
	api: '',
	signature: 'MnDdSk4JT3e6tkiAUdHfD7Mrs6SUrv',
	key: '',
	appId: 0,
	test: {
		repo: 'product-os-test/jellyfish-test-github',
	},
};

export const environment: Environment = {
	api: process.env['INTEGRATION_GITHUB_TOKEN'] || defaults.api,
	signature:
		process.env['INTEGRATION_GITHUB_SIGNATURE_KEY'] || defaults.signature,
	key: getPrivateKey() || defaults.key,
	appId: getAppId() || defaults.appId,
	test: {
		repo: process.env['TEST_INTEGRATION_GITHUB_REPO'] || defaults.test.repo,
	},
};
