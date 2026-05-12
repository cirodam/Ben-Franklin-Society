#!/usr/bin/env bash
# Start all BFS applications
# Prerequisite: governance database must be initialized (run `pnpm reset` first)

set -e

cd "$(dirname "$0")/.."

# Check if governance DB exists
if [[ ! -f apps/governance/dev.sqlite ]]; then
	echo "❌ Governance database not found!"
	echo ""
	echo "Run this command first to initialize:"
	echo "  pnpm reset"
	echo ""
	exit 1
fi

echo "🚀 Starting all BFS applications..."
echo ""
echo "  • Governance      → http://localhost:5173"
echo "  • Community Bank  → http://localhost:5174"
echo "  • Mail            → http://localhost:5175"
echo "  • Marketplace     → http://localhost:5176"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Start all four apps via turbo
exec turbo dev --filter=@bfs/governance --filter=@bfs/community-bank --filter=@bfs/mail --filter=@bfs/marketplace
