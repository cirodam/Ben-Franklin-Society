#!/bin/bash
cd "$(dirname "$0")"

# Initialize database if it doesn't exist
if [ ! -f dev.sqlite ]; then
    echo "Initializing database..."
    ./scripts/init-db.js
fi

# Start dev server
pnpm dev
