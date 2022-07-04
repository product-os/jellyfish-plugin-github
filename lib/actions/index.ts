import type { ActionDefinition } from '@balena/jellyfish-worker';
import { actionIntegrationGitHubMirrorEvent } from './action-integration-github-mirror-event';
import { actionIntegrationGitHubSyncOrgFromRepo } from './action-integration-github-sync-org-from-repo';

export const actions: ActionDefinition[] = [
	actionIntegrationGitHubMirrorEvent,
	actionIntegrationGitHubSyncOrgFromRepo,
];
