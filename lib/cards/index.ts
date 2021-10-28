/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

import viewAllIssues from './balena/view-all-issues.json';
import checkRun from './contrib/check-run';
import commit from './contrib/commit';
import githubOrg from './contrib/github-org';
import issue from './contrib/issue';
import pullRequest from './contrib/pull-request';
import push from './contrib/push.json';
import repository from './contrib/repository';
import triggeredActionConcludeCheckRun from './contrib/triggered-action-conclude-check-run';
import triggeredActionGitHubIssueLink from './contrib/triggered-action-github-issue-link.json';
import triggeredActionInProgressCheckRun from './contrib/triggered-action-in-progress-check-run';
import triggeredActionIntegrationGitHubMirrorEvent from './contrib/triggered-action-integration-github-mirror-event.json';
import triggeredActionSupportClosedIssueReopen from './contrib/triggered-action-support-closed-issue-reopen.json';
import triggeredActionSupportClosedPullRequestReopen from './contrib/triggered-action-support-closed-pull-request-reopen.json';

export const cards = [
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
	viewAllIssues,
];
