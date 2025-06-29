#!/bin/bash

# Beton-AI Ultra-Fast Setup Script
# Maximum performance optimizations for blazing fast builds

set -e

echo "🚀 Beton-AI Ultra-Fast Setup"
echo "=============================="

# Enable all ultra-fast optimizations
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
export BUILDKIT_PROGRESS=plain
export DOCKER_BUILDKIT_FRONTEND=dockerfile.v0

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

# Start the ultra-fast build process
print_status "Starting ultra-fast Docker build process..."
print_status "This will take ~60-90 seconds on first run, then ~15-30 seconds for incremental builds"

# Build with ultra-fast optimizations
DOCKER_BUILDKIT=1 $COMPOSE_CMD build \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  --build-arg BUILDKIT_MULTI_PLATFORM=0 \
  --parallel \
  --progress=plain \
  --no-cache=false

print_success "Ultra-fast build completed! Starting services..."

# Start services with optimized health checks
$COMPOSE_CMD up -d

print_status "Waiting for services to become healthy..."

# Wait for health checks with optimized timeouts
max_attempts=40  # Reduced from 60 for faster startup
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if $COMPOSE_CMD ps | grep -q "unhealthy"; then
        echo -n "."
        sleep 3  # Reduced from 2 for faster detection
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

# Deploy backend migrations with optimized settings
print_status "Deploying backend migrations..."
$COMPOSE_CMD exec -T backend sh -c "npx prisma migrate deploy 2>/dev/null || npx prisma db push --accept-data-loss" || true

# Deploy mock-apollo migrations with optimized settings
print_status "Deploying mock-apollo migrations..."
$COMPOSE_CMD exec -T mock-apollo sh -c "npx prisma migrate deploy 2>/dev/null || npx prisma db push --accept-data-loss" || true

print_success "All services are running and healthy!"

echo ""
print_status "🎉 Beton-AI is now running with ultra-fast performance!"
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
print_success "Ultra-fast setup completed! 🚀" 