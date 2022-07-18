/*
 * This file was automatically generated by 'npm run types'.
 *
 * DO NOT MODIFY IT BY HAND!
 */

// tslint:disable: array-type

import type { Contract, ContractDefinition } from 'autumndb';

export interface RepositoryData {
	owner?: string;
	name?: string;
	git_url?: string;
	html_url?: string;
	/**
	 * The id of the loop that uses this repository
	 */
	is_used_by?: string;
	[k: string]: unknown;
}

export interface RepositoryContractDefinition
	extends ContractDefinition<RepositoryData> {}

export interface RepositoryContract extends Contract<RepositoryData> {}