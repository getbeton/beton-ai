#!/bin/bash

echo "🔧 Beton-AI Database Setup Script"
echo "=================================="

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo "❌ Docker is not running. Please start Docker and try again."
        exit 1
    fi
    echo "✅ Docker is running"
}

# Function to check if .env file exists
check_env_files() {
    if [ ! -f "./backend/.env" ]; then
        echo "⚠️  backend/.env file not found. Creating from example..."
        if [ -f "./backend/env.example" ]; then
            cp ./backend/env.example ./backend/.env
            echo "✅ Created backend/.env from env.example"
        else
            echo "❌ env.example file not found. Please create backend/.env manually."
            exit 1
        fi
    fi
    
    if [ ! -f "./frontend/.env.local" ]; then
        echo "⚠️  frontend/.env.local file not found. Creating from example..."
        if [ -f "./frontend/env.local.example" ]; then
            cp ./frontend/env.local.example ./frontend/.env.local
            echo "✅ Created frontend/.env.local from env.local.example"
        else
            echo "❌ env.local.example file not found. Please create frontend/.env.local manually."
            exit 1
        fi
    fi
}

# Function to start database and run migrations
setup_database() {
    echo "🚀 Starting PostgreSQL container..."
    docker-compose up -d postgres
    
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 10
    
    echo "🔄 Running database migrations..."
    docker-compose run --rm backend npx prisma migrate deploy
    
    echo "✅ Database setup completed!"
}

# Function to generate Prisma client
generate_client() {
    echo "🔧 Generating Prisma client..."
    docker-compose run --rm backend npx prisma generate
    echo "✅ Prisma client generated!"
}

# Main execution
main() {
    check_docker
    check_env_files
    setup_database
    generate_client
    
    echo ""
    echo "🎉 Database setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Run 'docker-compose up' to start all services"
    echo "2. Access Prisma Studio: 'docker-compose run --rm backend npx prisma studio --browser none'"
    echo "3. View the application at http://localhost:3000"
    echo ""
}

# Run main function
main 