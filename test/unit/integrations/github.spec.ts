import * as crypto from 'node:crypto';
import { githubIntegrationDefinition } from '../../../lib/integrations/github';

const logContext = {
	id: `test-${crypto.randomUUID()}`,
};

describe('isEventValid()', () => {
	test('should return false given no signature header', async () => {
		const result = githubIntegrationDefinition.isEventValid(
			logContext,
			{
				api: 'xxxxx',
				signature: crypto.randomUUID(),
			},
			'....',
			{},
		);
		expect(result).toBe(false);
	});

	test('should return false given a signature but no key', async () => {
		const result = githubIntegrationDefinition.isEventValid(
			logContext,
			null,
			'....',
			{ 'x-hub-signature': 'sha1=aaaabbbbcccc' },
		);
		expect(result).toBe(false);
	});

	test('should return false given a signature mismatch', async () => {
		const result = githubIntegrationDefinition.isEventValid(
			logContext,
			{
				api: 'xxxxx',
				signature: crypto.randomUUID(),
			},
			'{"foo":"bar"}',
			{ 'x-hub-signature': 'sha1=foobarbaz' },
		);
		expect(result).toBe(false);
	});

	test('should return true given a signature match', async () => {
		const payload = '{"foo":"bar"}';
		const signature = crypto.randomUUID();
		const hash = crypto
			.createHmac('sha1', signature)
			.update(payload)
			.digest('hex');

		const result = githubIntegrationDefinition.isEventValid(
			logContext,
			{
				api: 'xxxxx',
				signature,
			},
			payload,
			{ 'x-hub-signature': `sha1=${hash}` },
		);
		expect(result).toBe(true);
	});
});
