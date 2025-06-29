#!/bin/bash

# Optimized Build Script for Beton-AI
# Uses Docker BuildKit features and parallel builds for maximum performance

set -e

echo "🚀 Building Beton-AI with Optimizations..."

# Enable BuildKit for better performance
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Build all services in parallel with optimizations
echo "📦 Building all services in parallel..."

# Build services with BuildKit optimizations
docker compose build \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  --parallel \
  --progress=plain \
  backend frontend mock-apollo

echo "✅ All services built with optimizations!"

# Show build results
echo "📊 Build Summary:"
docker images | grep beton-ai 