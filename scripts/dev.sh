#!/bin/bash
set -e

echo "� Starting GitHub AI Platform in development mode..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Run 'npm run setup' first."
    exit 1
fi

# Start databases if not running
if ! docker-compose ps mongodb | grep -q "Up"; then
    echo "� Starting databases..."
    docker-compose up -d mongodb redis
    sleep 5
fi

# Build shared packages first
echo "� Building shared packages..."
npm run build:shared

# Start all development servers
echo "�️ Starting development servers..."
npm run dev
