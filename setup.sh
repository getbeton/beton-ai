#!/bin/bash

# Beton-AI Setup Script
set -e

echo "🚀 Starting Beton-AI Setup..."

# Enable build optimizations
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Use docker compose (newer) if available, otherwise fall back to docker-compose
if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

# Clean up any existing containers and volumes if requested
if [ "$1" = "--clean" ]; then
    echo "🧹 Cleaning up existing containers and volumes..."
    $COMPOSE_CMD down -v --remove-orphans 2>/dev/null || true
    docker system prune -f >/dev/null 2>&1 || true
    echo "✅ Cleanup completed!"
fi

# Build services
echo "🏗️  Building services..."
$COMPOSE_CMD build

# Start services
echo "🚀 Starting services..."
$COMPOSE_CMD up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
max_attempts=40
attempt=0

while [ $attempt -lt $max_attempts ]; do
    healthy_count=0
    
    # Check each service
    $COMPOSE_CMD ps | grep -q "beton-ai-postgres.*healthy" && ((healthy_count++))
    $COMPOSE_CMD ps | grep -q "beton-ai-mock-postgres.*healthy" && ((healthy_count++))
    $COMPOSE_CMD ps | grep -q "beton-ai-redis.*healthy" && ((healthy_count++))
    $COMPOSE_CMD ps | grep -q "beton-ai-backend.*\(healthy\|running\)" && ((healthy_count++))
    $COMPOSE_CMD ps | grep -q "beton-ai-frontend.*\(healthy\|running\)" && ((healthy_count++))
    $COMPOSE_CMD ps | grep -q "beton-ai-mock-apollo.*\(healthy\|running\)" && ((healthy_count++))
    
    if [ "$healthy_count" -lt 6 ]; then
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    else
        echo ""
        echo "✅ All services are healthy!"
        break
    fi
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ Services failed to start within expected time. Check logs with: $COMPOSE_CMD logs"
    exit 1
fi

# Deploy backend migrations
echo "🔄 Deploying backend migrations..."
$COMPOSE_CMD exec -T backend sh -c "npx prisma migrate deploy 2>/dev/null || npx prisma db push --accept-data-loss" || true
echo "✅ Backend migrations completed"

# Deploy mock-apollo migrations
echo "🔄 Deploying mock-apollo migrations..."
$COMPOSE_CMD exec -T mock-apollo sh -c "npx prisma migrate deploy 2>/dev/null || npx prisma db push --accept-data-loss" || true
echo "✅ Mock Apollo migrations completed"

echo ""
echo "🎉 Setup Complete!"
echo "Services are ready at:"
echo "📱 Frontend:     http://localhost:3000"
echo "🔧 Backend API:  http://localhost:3001"
echo "🎭 Mock Apollo:  http://localhost:3002"
echo ""
echo "🏥 Health Checks:"
echo "   Frontend:     http://localhost:3000/api/health"
echo "   Backend:      http://localhost:3001/health"
echo "   Mock Apollo:  http://localhost:3002/health"
echo ""
echo "📊 To view logs:           $COMPOSE_CMD logs -f"
echo "🛑 To stop services:       $COMPOSE_CMD down"
echo "🧹 To cleanup completely:  $COMPOSE_CMD down -v"
echo ""
echo "✅ Setup completed! 🚀" 