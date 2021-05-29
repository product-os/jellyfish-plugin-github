###########################################################
# Runtime
###########################################################

FROM resinci/jellyfish-test:v1.3.46

WORKDIR /usr/src/jellyfish

COPY . ./
ARG NPM_TOKEN
RUN echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > ~/.npmrc && \
    npm ci && rm -f ~/.npmrc

CMD /bin/bash -c "npx ci-task-runner run --config /usr/src/jellyfish/test/ci-tasks.yml"
