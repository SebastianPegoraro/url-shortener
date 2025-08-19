#!/usr/bin/env sh
set -e

# For production: ensure DB is migrated before serving
if [ "${NODE_ENV}" = "production" ]; then
  echo "Running Prisma migrations (prod)..."
  npm run db:migrate:prod
fi

echo "Starting Next.js..."
exec "$@"
