#!/bin/sh

echo "🚀 Starting Beton-AI Backend..."

# Brief wait for PostgreSQL
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5
echo "✅ PostgreSQL should be ready!"

# Run Prisma migrations
echo "🔄 Running Prisma migrations..."

# First, try to resolve any existing migrations that may have been applied via db push
echo "🔧 Resolving existing migrations..."
npx prisma migrate resolve --applied 0_init 2>/dev/null || true

# Deploy any pending migrations
npx prisma migrate deploy

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

echo "✅ Migrations completed!"

# Start the application
echo "🎯 Starting the application..."
npm start 