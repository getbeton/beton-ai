#!/bin/bash
set -e

echo "🗄️  Mock Apollo Database Initialization"

# Database connection parameters
DB_HOST=${DB_HOST:-postgres}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_NAME=${DB_NAME:-mock_apollo}

# Extract database name from DATABASE_URL if available
if [ ! -z "$DATABASE_URL" ]; then
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
fi

echo "📊 Database: $DB_NAME on $DB_HOST:$DB_PORT"

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; then
        echo "✅ PostgreSQL is ready!"
        break
    fi
    echo "   Attempt $i/30 - PostgreSQL not ready yet..."
    sleep 2
done

# Create database if it doesn't exist
echo "🔧 Creating database '$DB_NAME' if it doesn't exist..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE \"$DB_NAME\""

echo "✅ Database '$DB_NAME' is ready!"

# Run Prisma migrations
echo "🔄 Running Prisma migrations..."
if ! npx prisma migrate deploy; then
    echo "⚠️  Prisma migration failed, trying to create and apply initial migration..."
    npx prisma migrate dev --name init --skip-generate || echo "⚠️  Migration creation failed, continuing..."
fi

# Check if data already exists
echo "🔍 Checking if data already exists..."
RECORD_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM \"MockPerson\";" 2>/dev/null | xargs || echo "0")

if [ "$RECORD_COUNT" -eq "0" ]; then
    echo "📦 No data found, running seed script..."
    npm run seed
else
    echo "✅ Data already exists ($RECORD_COUNT records), skipping seed."
fi

echo "🚀 Database initialization complete!" 