import { githubIntegrationDefinition } from '../../../lib/integrations/github';
import { v4 as uuidv4 } from 'uuid';

const logContext = {
	id: `test-${uuidv4()}`,
};

describe('isEventValid()', () => {
	test('should return false given no signature header', async () => {
		const result = githubIntegrationDefinition.isEventValid(
			logContext,
			null,
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
			null,
			'{"foo":"bar"}',
			{ 'x-hub-signature': 'sha1=foobarbaz' },
		);
		expect(result).toBe(false);
	});

	test('should return true given a signature match', async () => {
		const result = githubIntegrationDefinition.isEventValid(
			logContext,
			null,
			'{"foo":"bar"}',
			{ 'x-hub-signature': 'sha1=1a20b3c676d16f4a74243d96e9712b1219fc7553' },
		);
		expect(result).toBe(true);
	});
});
