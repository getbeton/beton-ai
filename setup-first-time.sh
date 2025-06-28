#!/bin/bash
echo "🚀 Beton-AI First Time Setup"
echo "================================"
echo ""

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

echo "✅ Docker is running"

# Check if required files exist
if [ ! -f "backend/env.example" ] || [ ! -f "frontend/env.local.example" ] || [ ! -f "mock-apollo/env.example" ]; then
    echo "❌ Missing environment example files. Please ensure you're in the project root directory."
    exit 1
fi

echo "📁 Creating environment files..."

# Create environment files if they don't exist
if [ ! -f "backend/.env" ]; then
    cp backend/env.example backend/.env
    echo "   ✅ Created backend/.env"
else
    echo "   ⚠️  backend/.env already exists (keeping existing)"
fi

if [ ! -f "frontend/.env.local" ]; then
    cp frontend/env.local.example frontend/.env.local
    echo "   ✅ Created frontend/.env.local" 
else
    echo "   ⚠️  frontend/.env.local already exists (keeping existing)"
fi

if [ ! -f "mock-apollo/.env" ]; then
    cp mock-apollo/env.example mock-apollo/.env
    echo "   ✅ Created mock-apollo/.env"
else
    echo "   ⚠️  mock-apollo/.env already exists (keeping existing)"
fi

echo ""
echo "🔧 Setting up dependencies..."

# Install dependencies for mock-apollo if needed
if [ ! -d "mock-apollo/node_modules" ]; then
    echo "   📦 Installing mock-apollo dependencies..."
    cd mock-apollo && npm install --silent && cd ..
    echo "   ✅ Mock Apollo dependencies installed"
else
    echo "   ✅ Mock Apollo dependencies already installed"
fi

echo ""
echo "🐳 Starting services for the first time..."
echo "   This may take a few minutes as Docker images are built..."
echo ""

# Make dev.sh executable
chmod +x dev.sh

# Start full Docker setup with mock Apollo
echo "1" | echo "y" | ./dev.sh &
SETUP_PID=$!

echo ""
echo "⏳ Waiting for services to initialize..."
echo "   - Building Docker images (first time takes longer)"
echo "   - Starting PostgreSQL and Redis"
echo "   - Creating mock_apollo database"
echo "   - Running database migrations"
echo "   - Seeding 100K mock entities (this takes ~60 seconds)"
echo ""
echo "💡 You can check progress with: docker-compose logs -f mock-apollo"
echo ""

# Wait a bit then show status
sleep 30

echo "🔍 Current setup status:"
docker-compose ps

echo ""
echo "📋 What's happening:"
echo "   1. ✅ Environment files created"
echo "   2. ✅ Dependencies installed"
echo "   3. 🔄 Docker services starting..."
echo "   4. ⏳ Database initialization in progress..."
echo ""
echo "🎯 Once complete, you'll have:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:3001"
echo "   - Mock Apollo: http://localhost:3002"
echo "   - PostgreSQL: localhost:5432"
echo "   - Redis: localhost:6379"
echo ""
echo "📚 Next steps:"
echo "   1. Visit http://localhost:3000 to see the app"
echo "   2. Configure your Supabase keys in backend/.env"
echo "   3. Read ENVIRONMENT.md for configuration options"
echo "   4. Check mock-apollo/README.md for mock service details"
echo ""
echo "🛑 To stop all services: docker-compose down"
echo "🔄 To restart development: ./dev.sh"
echo ""
echo "⚡ Setup script completed! Services are still starting in the background." 