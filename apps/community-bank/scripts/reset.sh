#!/usr/bin/env bash
set -e

DB="${DATABASE_PATH:-./bank.sqlite}"
GOV_DB="${GOVERNANCE_DATABASE_PATH:-../governance/db.sqlite}"

echo "Resetting Community Bank database at $DB…"
rm -f "$DB"

DATABASE_PATH="$DB" \
GOVERNANCE_DATABASE_PATH="$GOV_DB" \
  pnpm exec tsx scripts/seed.ts

echo "Reset complete."
