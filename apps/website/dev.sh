#!/bin/bash
# Start the website development server

cd "$(dirname "$0")"
echo "Starting Ben Franklin Society website..."
echo "Visit: http://localhost:5180"
echo ""
pnpm dev
