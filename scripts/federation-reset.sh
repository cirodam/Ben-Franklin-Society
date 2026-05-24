#!/usr/bin/env bash
# Reset Federation Registry database
# Clears all society registrations and metrics

set -e

cd "$(dirname "$0")/.."

echo "🔄 Resetting Federation Registry..."

# Remove SQLite database and WAL files
echo "  Removing federation database..."
rm -f apps/federation/federation.sqlite
rm -f apps/federation/federation.sqlite-wal
rm -f apps/federation/federation.sqlite-shm
rm -f apps/federation/data/federation.db
rm -f apps/federation/data/federation.db-wal
rm -f apps/federation/data/federation.db-shm

# Ensure filesystem sync
sync

echo "✅ Federation reset complete!"
echo ""
echo "To start federation, run:"
echo "  ./scripts/federation-start.sh"
echo ""
echo "The federation database will be recreated on first launch."
