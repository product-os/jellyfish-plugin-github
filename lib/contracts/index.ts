import type { ContractDefinition } from 'autumndb';
import { githubOrg } from './github-org';
import { issue } from './issue';
import { pullRequest } from './pull-request';
import { relationshipBrainstormTopicHasAttachedIssue } from './relationship-brainstorm-topic-has-attached-issue';
import { relationshipGitHubOrgBelongsToLoop } from './relationship-github-org-belongs-to-loop';
import { relationshipGitHubOrgHasThread } from './relationship-github-org-has-thread';
import { relationshipImprovementIsAttachedToIssue } from './relationship-improvement-is-attached-to-issue';
import { relationshipImprovementIsAttachedToPullRequest } from './relationship-improvement-is-attached-to-pull-request';
import { relationshipIssueHasAttachedPattern } from './relationship-issue-has-attached-pattern';
import { relationshipIssueIsAttachedToUserFeedback } from './relationship-issue-is-attached-to-user-feedback';
import { relationshipIssueIsOwnedByUser } from './relationship-issue-is-owned-by-user';
import { relationshipLoopHasRepository } from './relationship-loop-has-repository';
import { relationshipMilestoneIsAttachedToIssue } from './relationship-milestone-is-attached-to-issue';
import { relationshipMilestoneIsAttachedToPullRequest } from './relationship-milestone-is-attached-to-pull-request';
import { relationshipPullRequestHasAttachedPattern } from './relationship-pull-request-has-attached-pattern';
import { relationshipPullRequestHasBaseAtRepository } from './relationship-pull-request-has-base-at-repository';
import { relationshipPullRequestHasHeadAtRepository } from './relationship-pull-request-has-head-at-repository';
import { relationshipRepositoryBelongsToGitHubOrg } from './relationship-repository-belongs-to-github-org';
import { relationshipRepositoryHasThread } from './relationship-repository-has-thread';
import { relationshipRepositoryUsesRepository } from './relationship-repository-uses-repository';
import { relationshipSalesThreadIsAttachedToIssue } from './relationship-sales-thread-is-attached-to-issue';
import { relationshipSupportThreadIsAttachedToIssue } from './relationship-support-thread-is-attached-to-issue';
import { relationshipSupportThreadIsAttachedToPullRequest } from './relationship-support-thread-is-attached-to-pull-request';
import { repository } from './repository';
import { triggeredActionGitHubIssueLink } from './triggered-action-github-issue-link';
import { triggeredActionSupportClosedIssueReopen } from './triggered-action-support-closed-issue-reopen';
import { triggeredActionSupportClosedPullRequestReopen } from './triggered-action-support-closed-pull-request-reopen';
import { viewAllIssues } from './view-all-issues';
import { viewAllRepositories } from './view-all-repositories';

export const contracts: ContractDefinition[] = [
	githubOrg,
	issue,
	pullRequest,
	relationshipBrainstormTopicHasAttachedIssue,
	relationshipGitHubOrgBelongsToLoop,
	relationshipGitHubOrgHasThread,
	relationshipImprovementIsAttachedToIssue,
	relationshipImprovementIsAttachedToPullRequest,
	relationshipIssueHasAttachedPattern,
	relationshipIssueIsAttachedToUserFeedback,
	relationshipIssueIsOwnedByUser,
	relationshipLoopHasRepository,
	relationshipMilestoneIsAttachedToIssue,
	relationshipMilestoneIsAttachedToPullRequest,
	relationshipPullRequestHasAttachedPattern,
	relationshipPullRequestHasBaseAtRepository,
	relationshipPullRequestHasHeadAtRepository,
	relationshipRepositoryBelongsToGitHubOrg,
	relationshipRepositoryHasThread,
	relationshipRepositoryUsesRepository,
	relationshipSalesThreadIsAttachedToIssue,
	relationshipSupportThreadIsAttachedToIssue,
	relationshipSupportThreadIsAttachedToPullRequest,
	repository,
	triggeredActionGitHubIssueLink,
	triggeredActionSupportClosedIssueReopen,
	triggeredActionSupportClosedPullRequestReopen,
	viewAllIssues,
	viewAllRepositories,
];
