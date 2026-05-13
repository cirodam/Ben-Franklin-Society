#!/usr/bin/env bash
# Start all BFS applications
# On first launch, governance will show /setup page to create the first user

set -e

cd "$(dirname "$0")/.."

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
