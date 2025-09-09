#!/bin/bash
set -e

echo "í¿—ï¸ Building GitHub AI Platform for production..."

# Build all packages in dependency order
npm run build:shared
npm run build:core
# npm run build:ai
# npm run build:api
# npm run build:web
# npm run build:cli

echo "âœ… Build completed!"
