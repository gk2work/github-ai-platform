#!/bin/bash
set -e

echo "�� Running tests for GitHub AI Platform..."

# Build shared first
npm run build:shared

# Run tests for all packages
npm run test

echo "✅ All tests completed!"
