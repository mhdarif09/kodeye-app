#!/bin/sh
set -e

echo "Waiting for MySQL to be ready..."
until nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
  sleep 1
done
echo "MySQL is ready."

echo "Running database migrations..."
node src/db/migrate.js

echo "Starting server..."
exec "$@"
