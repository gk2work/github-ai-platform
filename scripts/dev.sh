#!/bin/bash
set -e

echo "íº€ Starting GitHub AI Platform in development mode..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "âŒ .env file not found. Run 'npm run setup' first."
    exit 1
fi

# Start databases if not running
if ! docker-compose ps mongodb | grep -q "Up"; then
    echo "í½ƒ Starting databases..."
    docker-compose up -d mongodb redis
    sleep 5
fi

# Build shared packages first
echo "í³¦ Building shared packages..."
npm run build:shared

# Start all development servers
echo "í¿—ï¸ Starting development servers..."
npm run dev
