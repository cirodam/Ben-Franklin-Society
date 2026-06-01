#!/bin/bash
# Start the website development server

cd "$(dirname "$0")"
echo "Starting The Working Society website..."
echo "Visit: http://localhost:5180"
echo ""
pnpm dev
