/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

import viewAllIssues from './balena/view-all-issues.json';
import checkRun from './contrib/check-run';
import issue from './contrib/issue';
import pullRequest from './contrib/pull-request';
import push from './contrib/push.json';
import repository from './contrib/repository';
import triggeredActionGitHubIssueLink from './contrib/triggered-action-github-issue-link.json';
import triggeredActionIntegrationGitHubMirrorEvent from './contrib/triggered-action-integration-github-mirror-event.json';
import triggeredActionSupportClosedIssueReopen from './contrib/triggered-action-support-closed-issue-reopen.json';
import triggeredActionSupportClosedPullRequestReopen from './contrib/triggered-action-support-closed-pull-request-reopen.json';

export default [
	checkRun,
	issue,
	pullRequest,
	push,
	repository,
	triggeredActionGitHubIssueLink,
	triggeredActionIntegrationGitHubMirrorEvent,
	triggeredActionSupportClosedIssueReopen,
	triggeredActionSupportClosedPullRequestReopen,
	viewAllIssues,
];
