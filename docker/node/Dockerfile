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

FROM app_base AS prod_deps

ENV NODE_ENV=production
RUN bun install --production --frozen-lockfile

FROM oven/bun:1.3-alpine AS prod

WORKDIR /app

# Copy package.json for ESM module resolution
COPY package.json ./

ENV APP_ENV=prod
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Copy production dependencies
COPY --from=prod_deps /app/node_modules ./node_modules
# Copy compiled code
COPY --from=build /app/dist .
# Copy HTML files for the dashboard (not compiled by TypeScript)
COPY src/Ui/Html ./src/Ui/Html

COPY docker/node/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
