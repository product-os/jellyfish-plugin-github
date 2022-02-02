import type { ActionDefinition } from '@balena/jellyfish-worker';
import { actionIntegrationGitHubMirrorEvent } from './action-integration-github-mirror-event';

export const actions: ActionDefinition[] = [actionIntegrationGitHubMirrorEvent];
