#!/bin/bash

# Beton-AI Optimized Development Setup Script
# This script provides fast development environment with hot reload

set -e

echo "🛠️ Beton-AI Optimized Development Setup"
echo "======================================="

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

# Use docker compose (newer) if available, otherwise fall back to docker-compose
if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

# Clean up any existing containers if requested
if [ "$1" = "--clean" ]; then
    print_warning "Cleaning up existing containers..."
    $COMPOSE_CMD -f docker-compose.yml -f docker-compose.dev.yml down -v --remove-orphans 2>/dev/null || true
    print_success "Cleanup completed!"
fi

print_status "Starting optimized development environment..."
print_status "Features: Hot reload, volume mounts, debug ports, watch mode"

# Build and start development environment with hot reload
DOCKER_BUILDKIT=1 $COMPOSE_CMD -f docker-compose.yml -f docker-compose.dev.yml up --build

print_success "Development environment stopped."
print_status "To restart: ./dev-optimized.sh"
print_status "To clean start: ./dev-optimized.sh --clean" 