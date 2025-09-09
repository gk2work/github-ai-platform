#!/bin/bash
set -e

echo "Ì∫Ä Setting up GitHub AI Platform..."

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "‚ùå Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "‚ùå Docker is required but not installed. Aborting." >&2; exit 1; }

# Check Node.js version (basic check)
NODE_VERSION=$(node -v | cut -c2-)
echo "‚úÖ Node.js version: $NODE_VERSION"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Ì≥ù Creating .env file from template..."
    cp .env.example .env
    echo "‚ö†Ô∏è  Please update .env file with your API keys"
fi

# Install dependencies
echo "Ì≥¶ Installing dependencies..."
npm run install:all

# Start databases
echo "ÌΩÉ Starting MongoDB and Redis..."
docker-compose up -d mongodb redis

# Wait for databases to be ready
echo "‚è≥ Waiting for databases to be ready..."
sleep 10

echo "‚úÖ Setup complete!"
echo ""
echo "ÌæØ Next steps:"
echo "1. Update .env file with your API keys"
echo "2. Run 'npm run dev' to start development servers"
echo "3. Visit http://localhost:3000 for the web app"
echo "4. Visit http://localhost:3001/graphql for the API playground"
