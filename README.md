# Jellyfish GitHub Plugin

Provides a sync integration for GitHub.

# Usage

Below is an example how to use this library:

```typescript
import { githubPlugin } from '@balena/jellyfish-plugin-github';
import { PluginManager } from '@balena/jellyfish-worker';

// Load contracts from this plugin
const pluginManager = new PluginManager([githubPlugin()]);
const contracts = pluginManager.getCards();
console.dir(contracts);
```

# Documentation

Visit the website for complete documentation: https://product-os.github.io/jellyfish-plugin-github

# Testing

Unit tests can be easily run with the command `npm test`.

You can run integration tests locally against Postgres and Redis instances running in `docker-compose`:
```bash
git submodule update --init
git secret reveal -f
npm run compose
export INTEGRATION_GITHUB_APP_ID=$(cat .balena/secrets/integration_github_app_id)
export INTEGRATION_GITHUB_PRIVATE_KEY=$(cat .balena/secrets/integration_github_private_key)
export INTEGRATION_GITHUB_TOKEN=$(cat .balena/secrets/integration_github_token)
REDIS_HOST=localhost POSTGRES_HOST=localhost npm run test:integration
```

You can also access these Postgres and Redis instances:
```bash
PGPASSWORD=docker psql -hlocalhost -Udocker
redis-cli -h localhost
```
