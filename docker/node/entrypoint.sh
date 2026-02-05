#!/bin/sh
set -e

# Start the app
if [ "$APP_ENV" = "prod" ]; then
  bun run src/index.ts
elif [ "$APP_ENV" = "dev" ]; then
  bun run --watch src/index.ts
else
  bun run src/index.ts
fi
