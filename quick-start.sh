#!/bin/bash
set -e

echo "🚀 Beton AI - Quick Start (Pre-built Images)"
echo "============================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose not found. Please install Docker Compose."
    exit 1
fi

echo "📥 Pulling pre-built images (this is much faster than building)..."

# Pull all required images
docker pull postgres:15-alpine
docker pull redis:7-alpine
docker pull betonai/backend:latest
docker pull betonai/frontend:latest
docker pull betonai/mock-apollo:latest

echo "✅ Images pulled successfully!"
echo ""

# Check if .env files exist, if not copy from examples
echo "⚙️  Setting up environment files..."

if [ ! -f backend/.env ]; then
    echo "📋 Creating backend/.env from example..."
    cp backend/env.example backend/.env
fi

if [ ! -f frontend/.env.local ]; then
    echo "📋 Creating frontend/.env.local from example..."
    cp frontend/env.local.example frontend/.env.local
fi

echo "✅ Environment files ready!"
echo ""

echo "🐳 Starting all services..."
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "⏳ Waiting for services to be ready..."
echo "   • Mock Apollo is seeding 10,000 entities (faster than 100k for first-time setup)"
echo "   • This may take 1-2 minutes..."

# Wait for services
sleep 30

echo ""
echo "🎉 Beton AI is starting up!"
echo ""
echo "📍 Access your application:"
echo "   • Frontend:     http://localhost:3000"
echo "   • Backend API:  http://localhost:3001"
echo "   • Mock Apollo:  http://localhost:3002"
echo ""
echo "📊 Check status:"
echo "   docker-compose -f docker-compose.prod.yml ps"
echo ""
echo "📝 View logs:"
echo "   docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "🛑 Stop services:"
echo "   docker-compose -f docker-compose.prod.yml down" 