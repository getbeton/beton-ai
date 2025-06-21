#!/bin/sh

echo "🚀 Starting Beton-AI Backend..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until npx prisma db push --accept-data-loss 2>/dev/null; do
  echo "⏳ PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Run Prisma migrations
echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy

echo "✅ Migrations completed!"

# Start the application
echo "🎯 Starting the application..."
npm start 