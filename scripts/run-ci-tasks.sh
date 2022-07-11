#!/usr/bin/env bash

# Run tasks
scripts/close-test-issues.js || true
npm run test:integration
