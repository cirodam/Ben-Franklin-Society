#!/usr/bin/env bash
# Start Federation Registry (standalone dev mode)
# Federation runs independently from society servers

set -e

cd "$(dirname "$0")/.."

echo "🚀 Starting Federation Registry..."
echo ""
echo "  • Federation API  → http://localhost:5180"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start federation via turbo
exec turbo dev --filter=@bfs/federation
