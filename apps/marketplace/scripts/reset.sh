#!/usr/bin/env bash
set -e

DB="${DATABASE_PATH:-./marketplace.sqlite}"
echo "Resetting marketplace database at $DB…"
rm -f "$DB"
pnpm exec tsx scripts/seed.ts
echo "Done."
