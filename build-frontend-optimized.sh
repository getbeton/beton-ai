#!/bin/bash

# Optimized Frontend Build Script
# Uses Docker BuildKit features for faster builds

set -e

echo "🚀 Building Frontend with Optimizations..."

# Enable BuildKit for better performance
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Build with optimizations
docker build \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  --cache-from beton-ai-frontend:latest \
  --target production \
  -t beton-ai-frontend:latest \
  -f frontend/Dockerfile \
  frontend/

echo "✅ Frontend build completed with optimizations!" 