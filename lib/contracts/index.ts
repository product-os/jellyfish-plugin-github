import type { ContractDefinition } from '@balena/jellyfish-types/build/core';
import { checkRun } from './check-run';
import { commit } from './commit';
import { githubOrg } from './github-org';
import { issue } from './issue';
import { pullRequest } from './pull-request';
import { push } from './push';
import { relationshipBrainstormTopicHasAttachedIssue } from './relationship-brainstorm-topic-has-attached-issue';
import { relationshipCommitHasAttachedCheckRun } from './relationship-commit-has-attached-check-run';
import { relationshipCommitIsAttachedToPullRequest } from './relationship-commit-is-attached-to-pull-request';
import { relationshipCommitWasBuiltIntoError } from './relationship-commit-was-built-into-error';
import { relationshipImprovementIsAttachedToIssue } from './relationship-improvement-is-attached-to-issue';
import { relationshipImprovementIsAttachedToPullRequest } from './relationship-improvement-is-attached-to-pull-request';
import { relationshipIssueHasAttachedPattern } from './relationship-issue-has-attached-pattern';
import { relationshipIssueIsAttachedToUserFeedback } from './relationship-issue-is-attached-to-user-feedback';
import { relationshipIssueIsOwnedByUser } from './relationship-issue-is-owned-by-user';
import { relationshipLoopHasRepository } from './relationship-loop-has-repository';
import { relationshipMessageIsAttachedToIssue } from './relationship-message-is-attached-to-issue';
import { relationshipMessageIsAttachedToPullRequest } from './relationship-message-is-attached-to-pull-request';
import { relationshipMilestoneIsAttachedToIssue } from './relationship-milestone-is-attached-to-issue';
import { relationshipMilestoneIsAttachedToPullRequest } from './relationship-milestone-is-attached-to-pull-request';
import { relationshipPullRequestHasAttachedPattern } from './relationship-pull-request-has-attached-pattern';
import { relationshipPullRequestHasBaseAtRepository } from './relationship-pull-request-has-base-at-repository';
import { relationshipPullRequestHasHeadAtRepository } from './relationship-pull-request-has-head-at-repository';
import { relationshipPushRefersToRepository } from './relationship-push-refers-to-repository';
import { relationshipRepositoryHasThread } from './relationship-repository-has-thread';
import { relationshipRepositoryUsesRepository } from './relationship-repository-uses-repository';
import { relationshipSalesThreadIsAttachedToIssue } from './relationship-sales-thread-is-attached-to-issue';
import { relationshipSupportThreadIsAttachedToIssue } from './relationship-support-thread-is-attached-to-issue';
import { relationshipSupportThreadIsAttachedToPullRequest } from './relationship-support-thread-is-attached-to-pull-request';
import { repository } from './repository';
import { triggeredActionConcludeCheckRun } from './triggered-action-conclude-check-run';
import { triggeredActionFailedCheckRun } from './triggered-action-failed-check-run';
import { triggeredActionGitHubIssueLink } from './triggered-action-github-issue-link';
import { triggeredActionInProgressCheckRun } from './triggered-action-in-progress-check-run';
import { triggeredActionIntegrationGitHubMirrorEntities } from './triggered-action-integration-github-mirror-entities';
import { triggeredActionIntegrationGitHubMirrorEvent } from './triggered-action-integration-github-mirror-event';
import { triggeredActionSupportClosedIssueReopen } from './triggered-action-support-closed-issue-reopen';
import { triggeredActionSupportClosedPullRequestReopen } from './triggered-action-support-closed-pull-request-reopen';
import { viewAllIssues } from './view-all-issues';
import { viewAllRepositories } from './view-all-repositories';

export const contracts: ContractDefinition[] = [
	checkRun,
	commit,
	githubOrg,
	issue,
	pullRequest,
	push,
	relationshipBrainstormTopicHasAttachedIssue,
	relationshipCommitHasAttachedCheckRun,
	relationshipCommitIsAttachedToPullRequest,
	relationshipCommitWasBuiltIntoError,
	relationshipImprovementIsAttachedToIssue,
	relationshipImprovementIsAttachedToPullRequest,
	relationshipIssueHasAttachedPattern,
	relationshipIssueIsAttachedToUserFeedback,
	relationshipIssueIsOwnedByUser,
	relationshipLoopHasRepository,
	relationshipMessageIsAttachedToIssue,
	relationshipMessageIsAttachedToPullRequest,
	relationshipMilestoneIsAttachedToIssue,
	relationshipMilestoneIsAttachedToPullRequest,
	relationshipPullRequestHasAttachedPattern,
	relationshipPullRequestHasBaseAtRepository,
	relationshipPullRequestHasHeadAtRepository,
	relationshipPushRefersToRepository,
	relationshipRepositoryHasThread,
	relationshipRepositoryUsesRepository,
	relationshipSalesThreadIsAttachedToIssue,
	relationshipSupportThreadIsAttachedToIssue,
	relationshipSupportThreadIsAttachedToPullRequest,
	repository,
	triggeredActionConcludeCheckRun,
	triggeredActionFailedCheckRun,
	triggeredActionGitHubIssueLink,
	triggeredActionInProgressCheckRun,
	triggeredActionIntegrationGitHubMirrorEntities,
	triggeredActionIntegrationGitHubMirrorEvent,
	triggeredActionSupportClosedIssueReopen,
	triggeredActionSupportClosedPullRequestReopen,
	viewAllIssues,
	viewAllRepositories,
];
