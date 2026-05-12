#!/usr/bin/env bash
# Reset all apps: delete databases and re-seed governance

set -e

cd "$(dirname "$0")/.."

echo "🔄 Resetting all apps..."

# Remove all SQLite databases and WAL files
echo "  Removing databases..."
rm -f apps/governance/dev.sqlite apps/governance/dev.sqlite-wal apps/governance/dev.sqlite-shm
rm -f apps/governance/db.sqlite apps/governance/db.sqlite-wal apps/governance/db.sqlite-shm
rm -f apps/community-bank/bank.sqlite apps/community-bank/bank.sqlite-wal apps/community-bank/bank.sqlite-shm
rm -f apps/mail/mail.sqlite apps/mail/mail.sqlite-wal apps/mail/mail.sqlite-shm
rm -f apps/marketplace/marketplace.sqlite apps/marketplace/marketplace.sqlite-wal apps/marketplace/marketplace.sqlite-shm

# Ensure filesystem sync
sync

# Optional: clear build artifacts
if [[ "$1" == "--clean" ]]; then
	echo "  Cleaning build artifacts..."
	rm -rf apps/*/.svelte-kit
	rm -rf apps/*/build
fi

# Re-seed governance database
echo "  Seeding governance database..."
cd apps/governance
DATABASE_PATH=./dev.sqlite pnpm seed
cd ../..

echo "✅ Reset complete!"
echo ""
echo "Default admin credentials:"
echo "  Handle:   @admin"
echo "  Password: changeme"
echo ""
echo "To start all apps, run:"
echo "  pnpm start"
