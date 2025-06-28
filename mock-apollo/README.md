# Mock Apollo Service

A standalone Docker service that simulates the Apollo API for development and testing purposes. This service provides realistic mock data and configurable latency simulation while maintaining Apollo API compatibility.

## Features

- 🎭 **Apollo API Compatible** - Mimics real Apollo API endpoints
- 📊 **100K Mock Entities** - Pre-seeded with realistic people, organizations, and locations
- ⏱️ **Configurable Latency** - Simulate real-world API response times
- 🔧 **Runtime Configuration** - Change settings without restart
- 🐳 **Docker Ready** - Fully containerized with automatic setup
- 🗄️ **Separate Database** - Uses its own PostgreSQL database (`mock_apollo`)

## Quick Start

### With Docker Compose (Recommended)

The service automatically starts with the main application:

```bash
# Start with mock Apollo included
./dev.sh
# Choose your development mode and select 'y' for Mock Apollo Service
```

### Manual Docker Setup

```bash
# Build and run
cd mock-apollo
docker build -t mock-apollo .
docker run -p 3002:3002 \
  -e DATABASE_URL=postgresql://postgres:postgres123@host.docker.internal:5432/mock_apollo \
  mock-apollo
```

### Local Development

```bash
cd mock-apollo

# Install dependencies
npm install

# Setup environment
cp env.example .env

# Setup database (requires PostgreSQL running)
npm run db:setup

# Start development server
npm run dev
```

## Database Setup

### Automatic Setup (Docker)

The Docker container automatically:
1. ✅ Waits for PostgreSQL to be ready
2. ✅ Creates `mock_apollo` database if it doesn't exist
3. ✅ Runs Prisma migrations to create tables
4. ✅ Seeds 100K entities (only if database is empty)
5. ✅ Starts the API server

### Manual Setup (Local Development)

```bash
# Create database
createdb mock_apollo

# Run migrations and seed
npm run db:setup

# Or reset and reseed
npm run db:reset
```

## API Endpoints

### Health Check
```bash
GET /health
# Returns service status and database connection info
```

### People Search (Apollo Compatible)
```bash
POST /api/v1/mixed_people/search
Content-Type: application/json

{
  "q_keywords": "john doe",
  "person_locations": ["San Francisco, CA"],
  "page": 1
}
```

### Configuration (Runtime)
```bash
# Get current configuration
GET /api/config

# Update latency settings
PUT /api/config/latency
{
  "baseLatencyMin": 200,
  "baseLatencyMax": 800,
  "perRecordLatency": 2,
  "perPageLatency": 10
}
```

## Environment Variables

### Required
```bash
DATABASE_URL=postgresql://postgres:postgres123@postgres:5432/mock_apollo
PORT=3002
NODE_ENV=development
```

### Optional
```bash
# Logging
LOG_LEVEL=info                    # error | warn | info | debug

# Latency Simulation (fallback defaults)
BASE_LATENCY_MIN=200             # Minimum base latency (ms)
BASE_LATENCY_MAX=800             # Maximum base latency (ms)  
PER_RECORD_LATENCY=2             # Additional latency per record (ms)
PER_PAGE_LATENCY=10              # Additional latency per page (ms)

# Data Seeding
SEED_ENTITY_COUNT=100000         # Number of entities to create

# Database Connection
DB_HOST=postgres                 # Database host
DB_PORT=5432                     # Database port
DB_USER=postgres                 # Database user
DB_NAME=mock_apollo              # Database name
```

## Data Model

### MockPerson
- Basic info: name, email, title, company
- Location: city, state, country
- Social: LinkedIn URL, phone
- Employment: seniority level, departments

### MockOrganization  
- Company details: name, domain, industry
- Location and size information
- Technology stack

### MockLocation
- Geographic data for realistic filtering
- City, state, country mappings

### ServiceConfig
- Runtime configuration storage
- Latency simulation parameters

## Development

### Project Structure
```
mock-apollo/
├── src/
│   ├── index.ts              # Main server
│   ├── routes/               # API routes
│   ├── services/             # Business logic
│   ├── scripts/              # Database scripts
│   └── types/                # TypeScript types
├── prisma/
│   └── schema.prisma         # Database schema
├── scripts/
│   └── init-db.sh           # Database initialization
└── Dockerfile               # Container definition
```

### Adding New Endpoints

1. Add route in `src/routes/`
2. Implement service logic in `src/services/`
3. Update types in `src/types/`
4. Test with main application

### Customizing Mock Data

Modify `src/scripts/seed.ts` to change:
- Entity generation logic
- Data distribution
- Realistic relationships

## Integration

### With Main Application

The mock service integrates with the main backend via `ApolloRouter`:

```typescript
// backend/src/services/apolloRouter.ts
// Automatically routes requests based on configuration:
// - mock_apollo:3002 for mock data
// - api.apollo.io for real data
```

### Configuration Files

```json
// backend/config/apollo.json
{
  "mode": "mixed",
  "endpoints": {
    "/api/v1/auth/health": { "mode": "real" },
    "/api/v1/mixed_people/search": { "mode": "configurable", "default": "mock" }
  },
  "mockService": {
    "url": "http://mock-apollo:3002",
    "timeout": 30000
  }
}
```

## Troubleshooting

### Container Keeps Restarting
```bash
# Check logs
docker-compose logs mock-apollo

# Common issues:
# - PostgreSQL not ready → Wait longer
# - Database doesn't exist → Check init script
# - Port conflicts → Change port mapping
```

### Database Connection Issues
```bash
# Test PostgreSQL connection
docker exec -it beton-ai-postgres psql -U postgres -l

# Recreate database
docker exec -it beton-ai-postgres psql -U postgres -c "DROP DATABASE IF EXISTS mock_apollo; CREATE DATABASE mock_apollo;"
```

### Prisma Issues
```bash
# Regenerate Prisma client
npm run generate

# Reset database
npm run db:reset

# Manual migration
npx prisma migrate reset --force
```

## Performance

- **100K entities** generated in ~30-60 seconds
- **Search responses** with configurable latency (200-800ms base)
- **Memory usage** ~200MB for full dataset
- **Database size** ~50MB with indexes

## License

Same as parent project - Open Source (specify license) 