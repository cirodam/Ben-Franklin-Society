#!/usr/bin/env bash
# Reset library database

set -e

cd "$(dirname "$0")/.."

DB_PATH="${DATABASE_PATH:-./library.sqlite}"

echo "🗑️  Deleting library database: $DB_PATH"
rm -f "$DB_PATH" "${DB_PATH}-shm" "${DB_PATH}-wal"

echo "✅ Library database reset complete"
