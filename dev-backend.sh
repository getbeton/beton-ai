#!/bin/bash

# Development script for backend with hot reload
echo "🚀 Starting Beton-AI Backend in Development Mode..."

# Check if we're in the right directory
if [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Source the setup_env_files function from setup.sh
source ./setup.sh

# Navigate to backend directory
cd backend

# Check and setup environment files if needed
setup_env_files

# Install dependencies if needed
echo "📦 Checking and installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Start development server with hot reload
echo "🔥 Starting backend with hot reload on http://localhost:3001"
echo "💡 Press 'rs' to manually restart the server"
echo "🛑 Press Ctrl+C to stop"
echo ""

# Use npx to ensure we're using the local installation
npx nodemon --exec npx ts-node src/index.ts 