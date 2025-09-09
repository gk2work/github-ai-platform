#!/bin/bash
set -e

echo "í·¹ Cleaning GitHub AI Platform..."

# Clean all packages
npm run clean

# Remove node_modules
echo "í·‘ï¸ Removing node_modules..."
find . -name "node_modules" -type d -prune -exec rm -rf {} + 2>/dev/null || true

# Remove lock files
rm -f package-lock.json
find . -name "package-lock.json" -delete 2>/dev/null || true

echo "âœ… Cleanup completed!"
