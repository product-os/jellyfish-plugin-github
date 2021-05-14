/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

import checkRun from './check-run';
import issue from './issue';
import pullRequest from './pull-request';
import push from './push.json';
import repository from './repository';
import triggeredActionGitHubIssueLink from './triggered-action-github-issue-link.json';
import triggeredActionIntegrationGitHubMirrorEvent from './triggered-action-integration-github-mirror-event.json';

export default [
	checkRun,
	issue,
	pullRequest,
	push,
	repository,
	triggeredActionGitHubIssueLink,
	triggeredActionIntegrationGitHubMirrorEvent,
];
