#!/bin/bash
# Startup script for GitHub Trending Tracker

echo "Starting GitHub Trending Tracker..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build TypeScript
echo "Building TypeScript..."
npm run build

# Start the API
echo "Starting API server..."
npm start
