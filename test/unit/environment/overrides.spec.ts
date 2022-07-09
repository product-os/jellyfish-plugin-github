process.env.INTEGRATION_GITHUB_TOKEN = 'foo';
process.env.INTEGRATION_GITHUB_SIGNATURE_KEY = 'bar';
process.env.INTEGRATION_GITHUB_PRIVATE_KEY = 'YnV6';
process.env.INTEGRATION_GITHUB_APP_ID = '1337';
process.env.TEST_INTEGRATION_GITHUB_REPO = 'foo/bar';

import { environment } from '../../../lib/environment';

afterAll(() => {
	delete process.env.INTEGRATION_GITHUB_TOKEN;
	delete process.env.INTEGRATION_GITHUB_SIGNATURE_KEY;
	delete process.env.INTEGRATION_GITHUB_PRIVATE_KEY;
	delete process.env.INTEGRATION_GITHUB_APP_ID;
});

test('Can override environment variable defaults', () => {
	expect(environment).toEqual({
		api: 'foo',
		signature: 'bar',
		key: 'buz',
		appId: 1337,
		test: {
			repo: 'foo/bar',
		},
	});
});
