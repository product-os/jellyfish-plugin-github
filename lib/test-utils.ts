import { testUtils as coreTestUtils } from 'autumndb';
import { testUtils as pluginDefaultTestUtils } from '@balena/jellyfish-plugin-default';
import type { Contract } from '@balena/jellyfish-types/build/core';
import type {
	ActionDefinition,
	PluginDefinition,
} from '@balena/jellyfish-worker';

/**
 * Context that can be used in tests using plugin-github.
 */
export interface TestContext extends pluginDefaultTestUtils.TestContext {
	createIssue: (
		actor: string,
		session: string,
		name: string | null,
		data: any,
		markers?: any,
	) => Promise<Contract>;
}

/**
 * Options accepted by `newContext`.
 */
export interface NewContextOptions extends coreTestUtils.NewContextOptions {
	/**
	 * Set of plugins needed to run tests.
	 */
	plugins?: PluginDefinition[];
	actions?: ActionDefinition[];
}

/**
 * Create a new `TestContext` with helper utilities.
 */
export const newContext = async (
	options: NewContextOptions = {},
): Promise<TestContext> => {
	const pluginDefaultTestContext = await pluginDefaultTestUtils.newContext(
		options,
	);

	const createIssue = async (
		actor: string,
		session: string,
		name: string | null,
		data: any,
		markers = [],
	) => {
		return pluginDefaultTestContext.createContract(
			actor,
			session,
			'issue@1.0.0',
			name,
			data,
			markers,
		);
	};

	return {
		createIssue,
		...pluginDefaultTestContext,
	};
};

/**
 * Deinitialize the worker.
 */
export const destroyContext = async (context: TestContext) => {
	await pluginDefaultTestUtils.destroyContext(context);
};
