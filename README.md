# Jellyfish GitHub Plugin

Provides a sync integration for GitHub.

# Usage

Below is an example how to use this library:

```js
import { cardMixins } from '@balena/jellyfish-core';
import { GitHubPlugin } from '@balena/jellyfish-plugin-github';

const plugin = new GitHubPlugin();

// Load cards from this plugin, can use custom mixins
const cards = plugin.getCards(context, cardMixins);
console.dir(cards);
```

# Documentation

[![Publish Documentation](https://github.com/product-os/jellyfish-plugin-github/actions/workflows/publish-docs.yml/badge.svg)](https://github.com/product-os/jellyfish-plugin-github/actions/workflows/publish-docs.yml)

Visit the website for complete documentation: https://product-os.github.io/jellyfish-plugin-github

# Testing

Unit tests can be easily run with the command `npm test`. This will run all unit tests (found in the `/lib` folder).

The integration tests require a postgres DB and redis server. The simplest way to run the tests locally is with docker-compose.

```
docker-compose -f docker-compose.test.yml -f docker-compose.yml up --build --exit-code-from=sut
```

## Manual Integration Testing against GitHub

To test mirror and translate functionality you need the following
* [Your own GitHub app](https://docs.github.com/en/developers/apps/building-github-apps/creating-a-github-app)
  * generate a private key for it and encode it as base64 (e.g. `cat private.pem | base64 -w0`)
	* install the app to your personal Org
* A [Personal Access Token](https://github.com/settings/tokens) (PAT) with all rights (that you want to test)
* A GitHub repository in your own org for testing

Next you need to configure your local JF instance by setting these env vars:
* `INTEGRATION_GITHUB_APP_ID=` AppID can be found on the about page of your app
* `INTEGRATION_GITHUB_PRIVATE_KEY=` the base64 encoded private key from above
* `INTEGRATION_GITHUB_SIGNATURE_KEY=` a random string (like "mysecret") that we'll use when configuring WebHooks below
* `INTEGRATION_GITHUB_TOKEN=` the PAT from above

Make sure to set those for all relevant containers!

Next we'll make our JF instance reachable from the internet. An easy way to do that is via [Cloudflared Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/trycloudflare).

After you've installed it run it TWICE (in two terminal windows) with `cloudflared tunnel --url http://ip-address-of-your-jf-instance:80 run`.
You should get two host names which we will use for (1) the UI and (2) the API.

To make our JF instance route this traffic properly we need to change its reverse proxy.
The easiest way is to replace it with Traefik and change its routing rules to match the host names from above.
A commit doing this can be found [here](https://github.com/product-os/product-os/commit/0c500532c23a46541649d29ae74a541d68b29d69).

As a final step we need to setup webhooks from your GitHub repo to your JF instance.
Create a new one under the settings of your repo, set the payload URL as `https://THE-HOSTNAME-FOR-THE-API/api/v2/hooks/github` and check `send me everything`.
As the secret set the random string, you made up above.

That's it! You should be getting webhooks, resulting in translate events and (if you target your own repo) should be able to mirror things into GitHub!
