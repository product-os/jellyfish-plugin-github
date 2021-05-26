MAKEFILE_PATH := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))

LOGLEVEL ?= info
export LOGLEVEL
INTEGRATION_DEFAULT_USER ?= admin
export INTEGRATION_DEFAULT_USER

DATABASE ?= postgres
export DATABASE
POSTGRES_USER ?= $(shell whoami)
export POSTGRES_USER
POSTGRES_PASSWORD ?=
export POSTGRES_PASSWORD
POSTGRES_PORT ?= 5432
export POSTGRES_PORT
POSTGRES_HOST ?= localhost
export POSTGRES_HOST
POSTGRES_DATABASE ?= jellyfish
export POSTGRES_DATABASE

REDIS_NAMESPACE ?= $(SERVER_DATABASE)
export REDIS_NAMESPACE
REDIS_PASSWORD ?=
export REDIS_PASSWORD
REDIS_PORT ?= 6379
export REDIS_PORT
REDIS_HOST ?= localhost
export REDIS_HOST

# GitHub
INTEGRATION_GITHUB_APP_ID ?=
export INTEGRATION_GITHUB_APP_ID
INTEGRATION_GITHUB_PRIVATE_KEY ?=
export INTEGRATION_GITHUB_PRIVATE_KEY
TEST_INTEGRATION_GITHUB_REPO ?= product-os/jellyfish-test-github
export TEST_INTEGRATION_GITHUB_REPO

# Define make commands that wrap npm scripts to ensure a more consistent workflow across repos
.PHONY: clean
clean:
	npm run clean

.PHONY: build
build:
	npm run build

.PHONY: lint
lint:
	npm run lint

.PHONY: lint-fix
lint-fix:
	npm run lint-fix

.PHONY: test-unit
test-unit:
	npx jest test/unit

.PHONY: test-integration
test-integration:
	npx jest --runInBand --bail test/integration

.PHONY: doc
doc:
	npm run doc

.PHONY: prepack
prepack:
	npm run prepack

.PHONY: check
check:
	npm run check
