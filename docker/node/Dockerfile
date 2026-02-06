FROM oven/bun:1.3-alpine AS app_base

# Set the working directory
WORKDIR /app

COPY package.json ./
COPY bun.lock* ./

# Ports
ENV PORT=3000

EXPOSE 3000

FROM app_base AS dev

# Install the dependencies
RUN bun install

ENV APP_ENV=dev
ENV NODE_ENV=development

COPY docker/node/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

FROM app_base AS test

# Install the dependencies
RUN bun install --frozen-lockfile

COPY . .

ENV APP_ENV=test
ENV NODE_ENV=development

COPY docker/node/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

FROM app_base AS build

COPY tsconfig.json .
COPY src ./src
COPY bin ./bin

RUN bun install
RUN bun run build

FROM app_base AS prod

ENV APP_ENV=prod
ENV NODE_ENV=production

RUN bun install --production --frozen-lockfile

COPY --from=build /app/dist .

COPY docker/node/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
