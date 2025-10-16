#!/bin/bash

# Start Development Environment with Hot Reload
# This script ensures proper startup order and environment configuration

set -e

echo "🚀 Starting Beton-AI Development Environment"
echo "=========================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker Desktop."
  exit 1
fi

# Stop any existing Docker containers
echo "🧹 Cleaning up existing containers..."
docker-compose down 2>/dev/null || true

# Start infrastructure services (PostgreSQL and Redis)
echo "📦 Starting PostgreSQL and Redis..."
docker-compose up -d postgres redis

echo "⏳ Waiting for database services to be ready..."
sleep 10

# Verify database is ready
until docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
  echo "   Waiting for PostgreSQL..."
  sleep 2
done

echo "✅ Database services are ready!"
echo ""

# Check environment files
if [ ! -f "backend/.env" ]; then
  echo "⚠️  backend/.env not found. Copying from example..."
  cp backend/env.example backend/.env
fi

if [ ! -f "frontend/.env.local" ]; then
  echo "⚠️  frontend/.env.local not found. Copying from example..."
  cp frontend/env.local.example frontend/.env.local
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
cd backend && npx prisma generate > /dev/null 2>&1
cd ..

# Run migrations
echo "🔄 Running database migrations..."
cd backend && npx prisma migrate deploy > /dev/null 2>&1
cd ..

echo "✅ Database is ready!"
echo ""
echo "=========================================="
echo "🔥 Starting Services in Development Mode"
echo "=========================================="
echo ""
echo "Backend:  http://localhost:3001 (Hot Reload)"
echo "Frontend: http://localhost:3000 (Hot Reload)"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Function to cleanup on exit
cleanup() {
  echo ""
  echo "🛑 Stopping services..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
  echo "✅ Services stopped"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend in background
cd backend
npm run dev > ../backend-dev.log 2>&1 &
BACKEND_PID=$!
cd ..

echo "⏳ Waiting for backend to start..."
sleep 8

# Verify backend is running
if curl -s http://localhost:3001/health > /dev/null; then
  echo "✅ Backend is running on http://localhost:3001"
else
  echo "⚠️  Backend may still be starting..."
fi

# Start frontend in background
cd frontend
npm run dev > ../frontend-dev.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo "⏳ Waiting for frontend to start..."
sleep 10

# Verify frontend is running
if curl -s http://localhost:3000 > /dev/null; then
  echo "✅ Frontend is running on http://localhost:3000"
else
  echo "⚠️  Frontend may still be starting..."
fi

echo ""
echo "=========================================="
echo "✅ All services are running!"
echo "=========================================="
echo ""
echo "📊 Service Status:"
echo "   Backend:  http://localhost:3001/health"
echo "   Frontend: http://localhost:3000"
echo "   Database: localhost:5432"
echo "   Redis:    localhost:6379"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f backend-dev.log"
echo "   Frontend: tail -f frontend-dev.log"
echo ""
echo "🌐 Open http://localhost:3000 in your browser"
echo ""
echo "Press Ctrl+C to stop..."

# Wait for user to stop
wait $BACKEND_PID $FRONTEND_PID

