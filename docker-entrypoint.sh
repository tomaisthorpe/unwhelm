#!/bin/sh
set -e

if [ "$NODE_ENV" = "development" ]; then
  echo "Generating Prisma client..."
  npx prisma generate
fi

echo "Running database migrations..."
npx prisma migrate deploy

# Create admin user if credentials are provided
if [ -n "$ADMIN_EMAIL" ] && [ -n "$ADMIN_PASSWORD" ]; then
  echo "Checking admin user..."
  ./node_modules/.bin/tsx prisma/create-admin.ts
fi

echo "Starting application..."
exec "$@"
