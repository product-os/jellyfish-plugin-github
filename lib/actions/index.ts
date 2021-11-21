import type { ActionFile } from '@balena/jellyfish-plugin-base';
import type { ContractData } from '@balena/jellyfish-types/build/core';
import { actionIntegrationGitHubMirrorEvent } from './action-integration-github-mirror-event';

export const actions: Array<ActionFile<ContractData>> = [
	actionIntegrationGitHubMirrorEvent,
];
