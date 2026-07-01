#!/bin/sh
set -e

# TEMPORARILY DISABLED: prisma migrate deploy is broken in Prisma 7.2.0 with Docker
# See: https://github.com/prisma/prisma/issues/28983
# TODO: Re-enable once Prisma fixes the bug or upgrade to a patched version
# echo "Running database migrations..."
# npx prisma migrate deploy

# Create admin user if credentials are provided
if [ -n "$ADMIN_EMAIL" ] && [ -n "$ADMIN_PASSWORD" ]; then
  echo "Checking admin user..."
  ./node_modules/.bin/tsx prisma/create-admin.ts
fi

echo "Starting application..."
exec "$@"
