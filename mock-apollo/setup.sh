#!/bin/sh
set -e

echo "🗄️ Mock Apollo Database Initialization"

# Parse DATABASE_URL to extract connection details
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set!"
    exit 1
fi

# Extract components from DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_HOST=$(echo $DATABASE_URL | sed -n 's|.*://[^:]*:[^@]*@\([^:]*\):.*|\1|p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's|.*://[^:]*:[^@]*@[^:]*:\([0-9]*\)/.*|\1|p')
DB_USER=$(echo $DATABASE_URL | sed -n 's|.*://\([^:]*\):.*@.*|\1|p')
DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's|.*/\([^?]*\).*|\1|p')

echo "🔗 Connecting to PostgreSQL at $DB_HOST:$DB_PORT"

# Wait for PostgreSQL
echo "⏳ Waiting for PostgreSQL..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"; do
    sleep 2
done
echo "✅ PostgreSQL is ready!"

# Database is created automatically by the postgres container
echo "✅ Database $DB_NAME is ready!"

# Run Prisma migrations
echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy

# Check if data exists
echo "🔍 Checking if data exists..."
RECORD_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM \"mock_people\";" 2>/dev/null | xargs || echo "0")

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

echo "✅ Database setup completed successfully!"
echo "🚀 Starting server..."
npm start 