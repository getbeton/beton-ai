#!/bin/bash

# Function to prompt for environment variables (extracted from setup.sh)
setup_env_files() {
    echo "📝 Setting up environment files..."
    
    # Backend .env setup
    if [ ! -f "backend/.env" ]; then
        echo "🔧 Configuring backend/.env"
        cp backend/env.example backend/.env
        
        echo "Please enter the following Supabase details (press Enter to use defaults):"
        read -p "Supabase URL: " supabase_url
        read -p "Supabase Anon Key: " supabase_anon_key
        read -p "Supabase Service Role Key: " supabase_service_role_key
        read -p "JWT Secret (or press Enter for random): " jwt_secret
        
        # Generate random JWT secret if not provided
        if [ -z "$jwt_secret" ]; then
            jwt_secret=$(openssl rand -base64 32)
        fi
        
        # Update backend/.env
        if [ ! -z "$supabase_url" ]; then
            sed -i.bak "s|SUPABASE_URL=.*|SUPABASE_URL=$supabase_url|" backend/.env
        fi
        if [ ! -z "$supabase_anon_key" ]; then
            sed -i.bak "s|SUPABASE_ANON_KEY=.*|SUPABASE_ANON_KEY=$supabase_anon_key|" backend/.env
        fi
        if [ ! -z "$supabase_service_role_key" ]; then
            sed -i.bak "s|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$supabase_service_role_key|" backend/.env
        fi
        sed -i.bak "s|JWT_SECRET=.*|JWT_SECRET=$jwt_secret|" backend/.env
        rm -f backend/.env.bak
    fi
    
    # Frontend .env.local setup
    if [ ! -f "frontend/.env.local" ]; then
        echo "🔧 Configuring frontend/.env.local"
        cp frontend/env.local.example frontend/.env.local
        
        # Use the same Supabase values for frontend
        if [ ! -z "$supabase_url" ]; then
            sed -i.bak "s|NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=$supabase_url|" frontend/.env.local
        fi
        if [ ! -z "$supabase_anon_key" ]; then
            sed -i.bak "s|NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=$supabase_anon_key|" frontend/.env.local
        fi
        rm -f frontend/.env.local.bak
    fi
    
    # Mock Apollo .env setup
    echo "✅ Environment files configured!"
}

echo "🚀 Beton-AI Development Environment"
echo ""
read -p "Include Mock Apollo Service? (y/n): " mock_apollo

# Check and setup environment files if needed
setup_env_files

echo "🔥 Starting Development Environment (Frontend + Backend Hot Reload)..."
echo "📦 Starting PostgreSQL, Redis and optional services..."

# Start infrastructure services in Docker (avoid backend and frontend)
if [[ $mock_apollo == "y" || $mock_apollo == "Y" ]]; then
    echo "📡 Mock Apollo Service will be included on port 3002"
    echo "📊 Mock PostgreSQL will be included on port 5433"
    docker-compose up -d postgres redis
else
    docker-compose up -d postgres redis
fi

echo "⏳ Waiting for services to start..."
sleep 3

echo "✅ Services are running:"
echo "   - PostgreSQL: localhost:5432"
echo "   - Redis: localhost:6379"
if [[ $mock_apollo == "y" || $mock_apollo == "Y" ]]; then
    echo "   - Mock PostgreSQL: localhost:5433"
    echo "   - Mock Apollo: http://localhost:3002"
fi
echo ""
echo "🔥 Starting both frontend and backend in development mode..."
echo "   - Frontend: http://localhost:3000 (Hot Reload)"
echo "   - Backend: http://localhost:3001 (Hot Reload)"
echo ""

# Start backend in background
./dev-backend.sh &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
cd frontend && npm run dev

# Clean up background process when script exits
trap "kill $BACKEND_PID 2>/dev/null" EXIT 