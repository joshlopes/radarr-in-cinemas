FROM oven/bun:1.0.3-alpine

COPY ./ ./

RUN bun run index.ts
