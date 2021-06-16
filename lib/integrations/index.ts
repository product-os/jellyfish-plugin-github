/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

import { IntegrationClass } from '@balena/jellyfish-plugin-base';
import { GitHubIntegration } from './github';

export const integrations: IntegrationClass[] = [GitHubIntegration];
