#!/bin/bash

# Development script for backend with hot reload
echo "🚀 Starting Beton-AI Backend in Development Mode..."

# Check if we're in the right directory
if [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Navigate to backend directory
cd backend

# Check if .env file exists, if not copy from example
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from example..."
    cp env.example .env
    echo "⚠️  Please update the .env file with your actual values"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Start development server with hot reload
echo "🔥 Starting backend with hot reload on http://localhost:3001"
echo "💡 Press 'rs' to manually restart the server"
echo "🛑 Press Ctrl+C to stop"
echo ""

npm run dev 