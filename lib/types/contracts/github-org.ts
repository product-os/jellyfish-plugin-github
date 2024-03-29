/*
 * This file was automatically generated by 'npm run types'.
 *
 * DO NOT MODIFY IT BY HAND!
 */

// tslint:disable: array-type

import type { Contract, ContractDefinition } from 'autumndb';

export interface GithubOrgData {
	github_id?: number;
	description?: string;
	login?: string;
	avatar_url?: string;
	url?: string;
	[k: string]: unknown;
}

export interface GithubOrgContractDefinition
	extends ContractDefinition<GithubOrgData> {}

export interface GithubOrgContract extends Contract<GithubOrgData> {}
