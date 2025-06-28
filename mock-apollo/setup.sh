#!/bin/sh
set -e

echo "🗄️ Mock Apollo Database Initialization"

# Wait for PostgreSQL
echo "⏳ Waiting for Mock PostgreSQL..."
until pg_isready -h mock-postgres -p 5432 -U postgres; do
    sleep 2
done
echo "✅ Mock PostgreSQL is ready!"

# Database is created automatically by the postgres container
echo "✅ Database mock_apollo is ready!"

# Run Prisma migrations
echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy

# Check if data exists
echo "🔍 Checking if data exists..."
RECORD_COUNT=$(PGPASSWORD=postgres123 psql -h mock-postgres -p 5432 -U postgres -d mock_apollo -t -c "SELECT COUNT(*) FROM \"mock_people\";" 2>/dev/null | xargs || echo "0")

if [ "$RECORD_COUNT" = "0" ]; then
    echo "📦 Seeding database..."
    npm run seed
    echo "📊 Generating breadcrumb cache..."
    npm run cache-breadcrumbs
else
    echo "✅ Data exists ($RECORD_COUNT records), skipping seed."
    echo "📊 Checking breadcrumb cache..."
    npm run cache-breadcrumbs
fi

echo "🚀 Starting server..."
npm start 