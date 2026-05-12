#!/usr/bin/env bash
set -euo pipefail

DB="${DATABASE_PATH:-./mail.sqlite}"
GOV_DB="${GOVERNANCE_DATABASE_PATH:-../governance/db.sqlite}"

echo "Resetting Mail database at $DB…"
rm -f "$DB"
DATABASE_PATH="$DB" GOVERNANCE_DATABASE_PATH="$GOV_DB" pnpm exec tsx scripts/seed.ts
echo "Reset complete."
