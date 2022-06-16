import { defaultEnvironment } from '@balena/jellyfish-environment';
import { defaultPlugin } from '@balena/jellyfish-plugin-default';
import { productOsPlugin } from '@balena/jellyfish-plugin-product-os';
import { testUtils as workerTestUtils } from '@balena/jellyfish-worker';
import jwt from 'jsonwebtoken';
import _ from 'lodash';
import nock from 'nock';
import path from 'path';
import { githubPlugin } from '../../lib';
import webhooks from './webhooks';

const TOKEN = defaultEnvironment.integration.github;
let ctx: workerTestUtils.TestContext;

beforeAll(async () => {
	ctx = await workerTestUtils.newContext({
		plugins: [productOsPlugin(), defaultPlugin(), githubPlugin()],
	});

	// TODO: Improve translate test suite/protocol to avoid this
	const triggeredActions = await ctx.kernel.query(ctx.logContext, ctx.session, {
		type: 'object',
		properties: {
			type: {
				const: 'triggered-action@1.0.0',
			},
			active: {
				const: true,
			},
		},
	});
	await Promise.all(
		triggeredActions.map(async (triggeredAction) => {
			await ctx.kernel.patchContractBySlug(
				ctx.logContext,
				ctx.session,
				`${triggeredAction.slug}@1.0.0`,
				[
					{
						op: 'replace',
						path: '/active',
						value: false,
					},
				],
			);
		}),
	);
	ctx.worker.setTriggers(ctx.logContext, []);

	await workerTestUtils.translateBeforeAll(ctx);
});

beforeEach(async () => {
	accessTokenNock();
});

afterEach(async () => {
	await workerTestUtils.translateAfterEach(ctx);
});

afterAll(() => {
	workerTestUtils.translateAfterAll();
	return workerTestUtils.destroyContext(ctx);
});

const accessTokenNock = () => {
	if (TOKEN.api && TOKEN.key) {
		nock('https://api.github.com')
			.persist()
			.post(/^\/app\/installations\/\d+\/access_tokens$/)
			.reply(function (_uri: string, _request: any, callback: any) {
				const token = this.req.headers.authorization[0].split(' ')[1];
				const privateKey = Buffer.from(TOKEN.key, 'base64').toString();
				jwt.verify(
					token,
					privateKey,
					{
						algorithms: ['RS256'],
					},
					(error: any) => {
						if (error) {
							return callback(error);
						}

						return callback(null, [
							201,
							{
								token: TOKEN.api,
								expires_at: '2056-07-11T22:14:10Z',
								permissions: {
									issues: 'write',
									contents: 'read',
								},
								repositories: [],
							},
						]);
					},
				);
			});
	}
};

describe('github-translate', () => {
	for (const testCaseName of Object.keys(webhooks)) {
		const testCase = webhooks[testCaseName];
		const expected = {
			head: testCase.expected.head,
			tail: _.sortBy(testCase.expected.tail, workerTestUtils.tailSort),
		};
		for (const variation of workerTestUtils.getVariations(testCase.steps, {
			permutations: false,
		})) {
			if (variation.combination.length !== testCase.steps.length) {
				continue;
			}

			test(`(${variation.name}) ${testCaseName}`, async () => {
				await workerTestUtils.webhookScenario(
					ctx,
					{
						steps: variation.combination,
						prepareEvent: async (event: any): Promise<any> => {
							return event;
						},
						offset:
							_.findIndex(testCase.steps, _.first(variation.combination)) + 1,
						headIndex: testCase.headIndex || 0,
						original: testCase.steps,
						ignoreUpdateEvents: true,
						expected: _.cloneDeep(expected),
						name: testCaseName,
						variant: variation.name,
					},
					{
						source: 'github',
						baseUrl: 'https://api.github.com',
						uriPath: /.*/,
						basePath: path.join(__dirname, 'webhooks'),
						isAuthorized: (request: any) => {
							return (
								request.headers.authorization &&
								request.headers.authorization[0] === `token ${TOKEN.api}`
							);
						},
						head: {
							ignore: {
								issue: ['data.participants'],
								'pull-request': ['data.participants'],
							},
						},
					},
				);
			});
		}
	}
});
