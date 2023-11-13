FROM oven/bun:1.0.3-alpine

COPY package.json ./
COPY bun.lockb ./
COPY src ./

RUN bun install

CMD ["bun index.ts"]
