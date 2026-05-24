#!/usr/bin/env bash
# Reset all apps: delete databases

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
rm -f apps/library/library.sqlite apps/library/library.sqlite-wal apps/library/library.sqlite-shm

# Remove user-generated library content
echo "  Clearing library documents..."
rm -f apps/governance/data/library/*.json
rm -rf apps/library/data/buckets

# Ensure filesystem sync
sync

# Optional: clear build artifacts
if [[ "$1" == "--clean" ]]; then
	echo "  Cleaning build artifacts..."
	rm -rf apps/*/.svelte-kit
	rm -rf apps/*/build
fi

echo "✅ Reset complete!"
echo ""
echo "To start all apps, run:"
echo "  pnpm start"
echo ""
echo "On first launch, governance will redirect to /setup"
echo "where you can create the first user account."
