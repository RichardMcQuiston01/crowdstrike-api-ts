# Runnable demo image for the CrowdStrike Falcon TypeScript helper.
# Uses bun to execute the TypeScript demo directly — no build step required.
#
# Build:  docker build -t crowdstrike-ts-demo .
# Run:    docker run --rm \
#           -e FALCON_CLIENT_ID -e FALCON_CLIENT_SECRET \
#           crowdstrike-ts-demo
FROM oven/bun:1-slim

WORKDIR /app

# The package declares no runtime dependencies, so a production install keeps
# the image lean while still honouring the lockfile if deps are added later.
COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
COPY examples ./examples

# Drop privileges — the base image ships a non-root `bun` user.
USER bun

CMD ["bun", "run", "examples/demo.ts"]
