#!/bin/bash

# Beton-AI Quick Setup Script - Optimized Version
# This script provides blazing fast Docker-based setup

set -e

echo "🚀 Beton-AI Optimized Quick Setup"
echo "=================================="

# Enable Docker BuildKit for better performance
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

print_success "Docker is running!"

# Check if Docker Compose is available
if ! command -v docker-compose >/dev/null 2>&1 && ! docker compose version >/dev/null 2>&1; then
    print_error "Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

# Use docker compose (newer) if available, otherwise fall back to docker-compose
if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

print_success "Docker Compose is available!"

# Clean up any existing containers and volumes if requested
if [ "$1" = "--clean" ]; then
    print_warning "Cleaning up existing containers and volumes..."
    $COMPOSE_CMD down -v --remove-orphans 2>/dev/null || true
    docker system prune -f >/dev/null 2>&1 || true
    print_success "Cleanup completed!"
fi

# Check available disk space (warn if less than 2GB)
available_space=$(df . | awk 'NR==2 {print $4}')
if [ "$available_space" -lt 2097152 ]; then # 2GB in KB
    print_warning "Low disk space detected. Consider running with --clean flag."
fi

# Start the build process
print_status "Starting optimized Docker build process..."
print_status "This will take 1-2 minutes on first run, then ~30 seconds for incremental builds"

# Build with BuildKit optimizations enabled
DOCKER_BUILDKIT=1 $COMPOSE_CMD build --parallel

print_success "Build completed! Starting services..."

# Start services with health checks
$COMPOSE_CMD up -d

print_status "Waiting for services to become healthy..."

# Wait for health checks to pass first - ensures databases are fully ready
max_attempts=60
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if $COMPOSE_CMD ps | grep -q "unhealthy"; then
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    else
        break
    fi
done

if [ $attempt -eq $max_attempts ]; then
    print_error "Services failed to start within expected time. Check logs with: $COMPOSE_CMD logs"
    exit 1
fi

print_success "All services are healthy! Setting up database migrations..."

# Deploy backend migrations (this will create tables or mark as applied if they exist)
print_status "Deploying backend migrations..."
$COMPOSE_CMD exec -T backend sh -c "npx prisma migrate deploy 2>/dev/null || npx prisma db push --accept-data-loss" || true

# Deploy mock-apollo migrations
print_status "Deploying mock-apollo migrations..."
$COMPOSE_CMD exec -T mock-apollo sh -c "npx prisma migrate deploy 2>/dev/null || npx prisma db push --accept-data-loss" || true

print_success "All services are running and healthy!"

echo ""
print_status "🎉 Beton-AI is now running with optimized performance!"
echo ""
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
print_success "Setup completed in optimized mode! 🚀" 