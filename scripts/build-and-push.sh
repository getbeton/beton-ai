#!/bin/bash
set -e

# Configuration
REGISTRY="betonai"  # Change this to your Docker Hub username or registry
VERSION="${1:-latest}"

echo "🏗️  Building and pushing Beton AI Docker images..."
echo "📦 Registry: $REGISTRY"
echo "🏷️  Version: $VERSION"

# Build and push backend
echo "🔨 Building backend..."
docker build -t $REGISTRY/backend:$VERSION ./backend
echo "📤 Pushing backend..."
docker push $REGISTRY/backend:$VERSION

# Build and push frontend
echo "🔨 Building frontend..."
docker build -t $REGISTRY/frontend:$VERSION ./frontend
echo "📤 Pushing frontend..."
docker push $REGISTRY/frontend:$VERSION

# Build and push mock-apollo
echo "🔨 Building mock-apollo..."
docker build -t $REGISTRY/mock-apollo:$VERSION ./mock-apollo
echo "📤 Pushing mock-apollo..."
docker push $REGISTRY/mock-apollo:$VERSION

echo "✅ All images built and pushed successfully!"
echo ""
echo "📋 Published images:"
echo "   • $REGISTRY/backend:$VERSION"
echo "   • $REGISTRY/frontend:$VERSION" 
echo "   • $REGISTRY/mock-apollo:$VERSION"
echo ""
echo "🚀 Users can now run: docker-compose -f docker-compose.prod.yml up -d" 