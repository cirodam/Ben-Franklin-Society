#!/usr/bin/env bash
set -euo pipefail

DB="${DATABASE_PATH:-./dev.sqlite}"

echo "Removing database: $DB"
rm -f "$DB"

echo "Done. Run 'pnpm dev' to start fresh."
