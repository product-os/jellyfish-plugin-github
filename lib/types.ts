import {
	Contract,
	ContractDefinition,
	EventData,
} from '@balena/jellyfish-types/build/core';

// https://docs.github.com/en/rest/reference/checks#get-a-check-run
// Maybe we can just pull types from octokit?
export interface GithubEventData extends EventData {
	headers: {
		[key: string]: string;
	};
	payload: {
		message?: string;
		installation?: {
			id: string;
		};
		check_run?: {
			check_suite: {
				id: string;
				updated_at?: string; // Don't see this in the GitHub docs...
			};
			external_id: string;
			app: {
				name: string;
			};
			head_sha: string;
			details_url: string;
			status: string;
			started_at: string;
			conclusion: string;
			completed_at: string;
			id: string;
			updated_at: string;
		};
		[key: string]: any;
	};
}

export interface GithubEventContractDefinition
	extends ContractDefinition<GithubEventData> {}

export interface GithubEventContract extends Contract<GithubEventData> {}
