#!/bin/sh

echo "🚀 Starting Beton-AI Backend..."

# Only run wait-for-postgres in local development (where host is 'postgres')
if [ -z "$RAILWAY_ENVIRONMENT" ]; then
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
fi

# Run Prisma migrations
echo "🔄 Running database setup..."

# Only try to create DB in local dev
if [ -z "$RAILWAY_ENVIRONMENT" ]; then
    psql -h postgres -U postgres -c "CREATE DATABASE beton_ai;" 2>/dev/null || true
fi

# Deploy migrations
echo "📦 Attempting migrations..."
npx prisma migrate deploy

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Start the application
echo "🎯 Starting the application..."
npm start 