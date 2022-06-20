#!/usr/bin/env bash

# Set necessary environment variables
export INTEGRATION_GITHUB_APP_ID=$(cat /run/secrets/integration_github_app_id)
export INTEGRATION_GITHUB_PRIVATE_KEY=$(cat /run/secrets/integration_github_private_key)
export INTEGRATION_GITHUB_TOKEN=$(cat /run/secrets/integration_github_token)

# Run tasks
scripts/close-test-issues.js || true
npm run test:integration
