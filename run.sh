#!/bin/bash

# Beton-AI Development Runner
echo "🚀 Starting Beton-AI Development Environment"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Function to install dependencies
install_deps() {
    echo "📦 Installing dependencies..."
    npm install
    
    echo "📦 Installing backend dependencies..."
    cd backend && npm install
    
    echo "📦 Installing frontend dependencies..."
    cd ../frontend && npm install
    
    cd ..
    echo "✅ Dependencies installed successfully!"
}

# Function to setup environment files
setup_env() {
    echo "⚙️ Setting up environment files..."
    
    if [ ! -f backend/.env ]; then
        cp backend/env.example backend/.env
        echo "📄 Created backend/.env from example"
        echo "⚠️  Please update backend/.env with your actual environment variables"
    fi
    
    if [ ! -f frontend/.env.local ]; then
        cp frontend/env.local.example frontend/.env.local
        echo "📄 Created frontend/.env.local from example"
        echo "⚠️  Please update frontend/.env.local with your actual environment variables"
    fi
}

# Function to run with Docker
run_docker() {
    echo "🐳 Starting with Docker..."
    docker-compose up --build
}

# Function to run in development mode
run_dev() {
    echo "💻 Starting in development mode..."
    
    # Check if dependencies are installed
    if [ ! -d "node_modules" ] || [ ! -d "backend/node_modules" ] || [ ! -d "frontend/node_modules" ]; then
        install_deps
    fi
    
    setup_env
    
    # Start PostgreSQL with Docker (if not running)
    echo "🗄️ Starting PostgreSQL..."
    docker-compose up -d postgres
    
    # Wait for PostgreSQL to be ready
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5
    
    # Generate Prisma client and run migrations
    echo "🔄 Setting up database..."
    cd backend
    npx prisma generate
    
    # Check if migrations directory exists, if so use migrate deploy, otherwise use db push
    if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations)" ]; then
        echo "📊 Running database migrations..."
        npx prisma migrate deploy
    else
        echo "📊 Pushing database schema..."
        npx prisma db push
    fi
    cd ..
    
    # Start both frontend and backend
    echo "🎯 Starting frontend and backend..."
    npm run dev
}

# Parse command line arguments
case ${1:-dev} in
    "docker")
        run_docker
        ;;
    "install")
        install_deps
        ;;
    "setup")
        setup_env
        ;;
    "dev"|"")
        run_dev
        ;;
    *)
        echo "Usage: $0 [docker|dev|install|setup]"
        echo ""
        echo "Commands:"
        echo "  dev     - Run in development mode (default)"
        echo "  docker  - Run with Docker Compose"
        echo "  install - Install all dependencies"
        echo "  setup   - Setup environment files"
        exit 1
        ;;
esac 