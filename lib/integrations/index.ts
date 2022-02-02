import type { IntegrationDefinition, Map } from '@balena/jellyfish-worker';
import { githubIntegrationDefinition } from './github';

export const integrations: Map<IntegrationDefinition> = {
	github: githubIntegrationDefinition,
};
