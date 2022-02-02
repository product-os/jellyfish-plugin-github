import type { ContractDefinition } from '@balena/jellyfish-types/build/core';
import { viewAllIssues } from './view-all-issues';
import { checkRun } from './check-run';
import { commit } from './commit';
import { githubOrg } from './github-org';
import { issue } from './issue';
import { pullRequest } from './pull-request';
import { push } from './push';
import { repository } from './repository';
import { triggeredActionConcludeCheckRun } from './triggered-action-conclude-check-run';
import { triggeredActionInProgressCheckRun } from './triggered-action-in-progress-check-run';
import { triggeredActionFailedCheckRun } from './triggered-action-failed-check-run';
import { triggeredActionGitHubIssueLink } from './triggered-action-github-issue-link';
import { triggeredActionIntegrationGitHubMirrorEvent } from './triggered-action-integration-github-mirror-event';
import { triggeredActionSupportClosedIssueReopen } from './triggered-action-support-closed-issue-reopen';
import { triggeredActionSupportClosedPullRequestReopen } from './triggered-action-support-closed-pull-request-reopen';

export const contracts: ContractDefinition[] = [
	checkRun,
	commit,
	githubOrg,
	issue,
	pullRequest,
	push,
	repository,
	triggeredActionGitHubIssueLink,
	triggeredActionIntegrationGitHubMirrorEvent,
	triggeredActionSupportClosedIssueReopen,
	triggeredActionSupportClosedPullRequestReopen,
	triggeredActionConcludeCheckRun,
	triggeredActionInProgressCheckRun,
	triggeredActionFailedCheckRun,
	viewAllIssues,
];
