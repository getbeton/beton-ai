#!/bin/sh

echo "🚀 Starting Beton-AI Backend..."

# Function to check if PostgreSQL is ready
check_postgres() {
    pg_isready -h postgres -p 5432 -U postgres
    return $?
}

# Wait for PostgreSQL with timeout
echo "⏳ Waiting for PostgreSQL to be ready..."
RETRIES=30
until check_postgres || [ $RETRIES -eq 0 ]; do
    echo "Waiting for PostgreSQL ($RETRIES remaining attempts)..."
    RETRIES=$((RETRIES-1))
    sleep 2
done

if [ $RETRIES -eq 0 ]; then
    echo "❌ Failed to connect to PostgreSQL"
    exit 1
fi

echo "✅ PostgreSQL is ready!"

# Run Prisma migrations
echo "🔄 Running database setup..."

# Try to create the database if it doesn't exist
psql -h postgres -U postgres -c "CREATE DATABASE beton_ai;" 2>/dev/null || true

# Deploy migrations with retries
MAX_MIGRATION_ATTEMPTS=3
MIGRATION_ATTEMPT=1

while [ $MIGRATION_ATTEMPT -le $MAX_MIGRATION_ATTEMPTS ]; do
    echo "📦 Attempting migrations (attempt $MIGRATION_ATTEMPT of $MAX_MIGRATION_ATTEMPTS)..."

    if npx prisma migrate deploy; then
        echo "✅ Migrations completed successfully!"
        break
    else
        if [ $MIGRATION_ATTEMPT -eq $MAX_MIGRATION_ATTEMPTS ]; then
            echo "❌ Migration failed after $MAX_MIGRATION_ATTEMPTS attempts"
            exit 1
        fi
        echo "⚠️ Migration attempt failed, retrying..."
        sleep 5
        MIGRATION_ATTEMPT=$((MIGRATION_ATTEMPT+1))
    fi
done

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Start the application
echo "🎯 Starting the application..."
npm start 