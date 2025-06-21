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

case $choice in
    1)
        echo "🐳 Starting all services in Docker..."
        docker-compose up -d
        echo ""
        echo "✅ All services running in Docker:"
        echo "   - Frontend: http://localhost:3000"
        echo "   - Backend: http://localhost:3001"
        echo "   - PostgreSQL: localhost:5432"
        ;;
    2)
        echo "🎨 Starting Frontend Dev + Backend Docker (Hot Reload)..."
        echo "📦 Starting backend services..."
        docker-compose up postgres backend -d
        
        echo "⏳ Waiting for services to start..."
        sleep 5
        
        echo "✅ Backend services are running!"
        echo "   - PostgreSQL: localhost:5432"
        echo "   - Backend API: http://localhost:3001"
        echo ""
        echo "🎨 Starting frontend in development mode..."
        echo "   - Frontend: http://localhost:3000 (Hot Reload)"
        echo ""
        
        cd frontend && npm run dev
        ;;
    3)
        echo "⚡ Starting Backend Dev + Frontend Docker..."
        echo "📦 Starting frontend and database..."
        docker-compose up postgres frontend -d
        
        echo "⏳ Waiting for services to start..."
        sleep 5
        
        echo "✅ Frontend and database are running!"
        echo "   - Frontend: http://localhost:3000"
        echo "   - PostgreSQL: localhost:5432"
        echo ""
        echo "⚡ Starting backend in development mode..."
        echo "   - Backend: http://localhost:3001 (Hot Reload)"
        echo ""
        
        ./dev-backend.sh
        ;;
    4)
        echo "🔥 Starting Both Dev (Frontend + Backend Hot Reload)..."
        echo "📦 Starting PostgreSQL..."
        docker-compose up postgres -d
        
        echo "⏳ Waiting for database to start..."
        sleep 3
        
        echo "✅ PostgreSQL is running on localhost:5432"
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
        echo "📦 Starting PostgreSQL..."
        docker-compose up postgres -d
        
        echo "⏳ Waiting for database to start..."
        sleep 3
        
        echo "✅ PostgreSQL is running on localhost:5432"
        echo ""
        
        ./dev-backend.sh
        ;;
    6)
        echo "🎨 Starting Frontend Dev Only..."
        echo "📦 Starting backend services..."
        docker-compose up postgres backend -d
        
        echo "⏳ Waiting for services to start..."
        sleep 5
        
        echo "✅ Backend services are running!"
        echo "   - Backend API: http://localhost:3001"
        echo "   - PostgreSQL: localhost:5432"
        echo ""
        
        cd frontend && npm run dev
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again and choose 1-6."
        exit 1
        ;;
esac 