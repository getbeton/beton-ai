#!/bin/bash

echo "🚀 Beton-AI Development Environment"
echo ""
echo "Choose your development mode:"
echo "1) Full Docker (all services in containers)"
echo "2) Frontend Dev + Backend Docker (recommended)"
echo "3) Backend Dev + Frontend Docker"
echo "4) Both Dev (frontend + backend local with hot reload)"
echo "5) Backend Dev Only"
echo "6) Frontend Dev Only"
echo ""
read -p "Enter your choice (1-6): " choice
echo ""
read -p "Include Mock Apollo Service? (y/n): " mock_apollo

# Build services list based on mock Apollo choice
MOCK_APOLLO_SERVICES=""
if [[ $mock_apollo == "y" || $mock_apollo == "Y" ]]; then
    MOCK_APOLLO_SERVICES="mock-postgres mock-apollo"
    echo "📡 Mock Apollo Service will be included on port 3002"
    echo "📊 Mock PostgreSQL will be included on port 5433"
    echo ""
fi

case $choice in
    1)
        echo "🐳 Starting all services in Docker..."
        docker-compose up -d postgres redis backend frontend $MOCK_APOLLO_SERVICES
        echo ""
        echo "✅ All services running in Docker:"
        echo "   - Frontend: http://localhost:3000"
        echo "   - Backend: http://localhost:3001"
        echo "   - PostgreSQL: localhost:5432"
        echo "   - Redis: localhost:6379"
        if [[ $mock_apollo == "y" || $mock_apollo == "Y" ]]; then
            echo "   - Mock Apollo: http://localhost:3002"
        fi
        ;;
    2)
        echo "🎨 Starting Frontend Dev + Backend Docker (Hot Reload)..."
        echo "📦 Starting backend services..."
        docker-compose up postgres redis backend $MOCK_APOLLO_SERVICES -d
        
        echo "⏳ Waiting for services to start..."
        sleep 5
        
        echo "✅ Backend services are running!"
        echo "   - PostgreSQL: localhost:5432"
        echo "   - Redis: localhost:6379"
        echo "   - Backend API: http://localhost:3001"
        if [[ $mock_apollo == "y" || $mock_apollo == "Y" ]]; then
            echo "   - Mock Apollo: http://localhost:3002"
        fi
        echo ""
        echo "🎨 Starting frontend in development mode..."
        echo "   - Frontend: http://localhost:3000 (Hot Reload)"
        echo ""
        echo "💡 Note: If port 3000 is busy, Next.js will auto-select another port"
        echo "   Make sure it doesn't conflict with Mock Apollo (port 3002)"
        echo ""
        
        cd frontend && npm run dev
        ;;
    3)
        echo "⚡ Starting Backend Dev + Frontend Docker..."
        echo "📦 Starting frontend and database..."
        docker-compose up postgres redis frontend $MOCK_APOLLO_SERVICES -d
        
        echo "⏳ Waiting for services to start..."
        sleep 5
        
        echo "✅ Frontend and database are running!"
        echo "   - Frontend: http://localhost:3000"
        echo "   - PostgreSQL: localhost:5432"
        echo "   - Redis: localhost:6379"
        if [[ $mock_apollo == "y" || $mock_apollo == "Y" ]]; then
            echo "   - Mock Apollo: http://localhost:3002"
        fi
        echo ""
        echo "⚡ Starting backend in development mode..."
        echo "   - Backend: http://localhost:3001 (Hot Reload)"
        echo ""
        
        ./dev-backend.sh
        ;;
    4)
        echo "🔥 Starting Both Dev (Frontend + Backend Hot Reload)..."
        echo "📦 Starting PostgreSQL, Redis and optional services..."
        docker-compose up postgres redis $MOCK_APOLLO_SERVICES -d
        
        echo "⏳ Waiting for services to start..."
        sleep 3
        
        echo "✅ Services are running:"
        echo "   - PostgreSQL: localhost:5432"
        echo "   - Redis: localhost:6379"
        if [[ $mock_apollo == "y" || $mock_apollo == "Y" ]]; then
            echo "   - Mock Apollo: http://localhost:3002"
        fi
        echo ""
        echo "🔥 Starting both frontend and backend in development mode..."
        echo "   - Frontend: http://localhost:3000 (Hot Reload)"
        echo "   - Backend: http://localhost:3001 (Hot Reload)"
        echo ""
        echo "Opening two terminal windows..."
        
        # Start backend in background
        ./dev-backend.sh &
        BACKEND_PID=$!
        
        # Wait a moment for backend to start
        sleep 3
        
        # Start frontend
        cd frontend && npm run dev
        
        # Clean up background process when script exits
        trap "kill $BACKEND_PID 2>/dev/null" EXIT
        ;;
    5)
        echo "⚡ Starting Backend Dev Only..."
        echo "📦 Starting PostgreSQL, Redis and optional services..."
        docker-compose up postgres redis $MOCK_APOLLO_SERVICES -d
        
        echo "⏳ Waiting for services to start..."
        sleep 3
        
        echo "✅ Services are running:"
        echo "   - PostgreSQL: localhost:5432"
        echo "   - Redis: localhost:6379"
        if [[ $mock_apollo == "y" || $mock_apollo == "Y" ]]; then
            echo "   - Mock Apollo: http://localhost:3002"
        fi
        echo ""
        
        ./dev-backend.sh
        ;;
    6)
        echo "🎨 Starting Frontend Dev Only..."
        echo "📦 Starting backend services..."
        docker-compose up postgres redis backend $MOCK_APOLLO_SERVICES -d
        
        echo "⏳ Waiting for services to start..."
        sleep 5
        
        echo "✅ Backend services are running!"
        echo "   - Backend API: http://localhost:3001"
        echo "   - PostgreSQL: localhost:5432"
        echo "   - Redis: localhost:6379"
        if [[ $mock_apollo == "y" || $mock_apollo == "Y" ]]; then
            echo "   - Mock Apollo: http://localhost:3002"
        fi
        echo ""
        
        cd frontend && npm run dev
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again and choose 1-6."
        exit 1
        ;;
esac 