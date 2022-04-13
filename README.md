# Jellyfish GitHub Plugin

Provides a sync integration for GitHub.

# Usage

Below is an example how to use this library:

```js
import { defaultPlugin } from '@balena/jellyfish-plugin-default';
import { githubPlugin } from '@balena/jellyfish-plugin-github';
import { PluginManager } from '@balena/jellyfish-worker';

// Load cards from this plugin
const pluginManager = new PluginManager([defaultPlugin(), githubPlugin()]);
const cards = pluginManager.getCards();
console.dir(cards);
```

# Documentation

[![Publish Documentation](https://github.com/product-os/jellyfish-plugin-github/actions/workflows/publish-docs.yml/badge.svg)](https://github.com/product-os/jellyfish-plugin-github/actions/workflows/publish-docs.yml)

Visit the website for complete documentation: https://product-os.github.io/jellyfish-plugin-github

# Testing

Unit tests can be easily run with the command `npm test`.

The integration tests require Postgres and Redis instances. The simplest way to run the tests locally is with `docker-compose`.

```
git secret reveal -f
npm run test:compose
```

You can also run tests locally against Postgres and Redis instances running in `docker-compose`:
```
git secret reveal -f
npm run compose
export INTEGRATION_GITHUB_APP_ID=$(cat .balena/secrets/integration_github_app_id)
export INTEGRATION_GITHUB_PRIVATE_KEY=$(cat .balena/secrets/integration_github_private_key)
export INTEGRATION_GITHUB_SIGNATURE_KEY=$(cat .balena/secrets/integration_github_signature_key)
export INTEGRATION_GITHUB_TOKEN=$(cat .balena/secrets/integration_github_token)
REDIS_HOST=localhost POSTGRES_HOST=localhost npx jest test/integration/cards/contrib/triggered-action-github-issue-link.spec.ts
```

You can also access these Postgres and Redis instances:
```
PGPASSWORD=docker psql -hlocalhost -Udocker
redis-cli -h localhost
```
