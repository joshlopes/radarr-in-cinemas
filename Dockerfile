FROM oven/bun:1.0.3-alpine

COPY ./ ./

CMD ["bun run index.ts"]
