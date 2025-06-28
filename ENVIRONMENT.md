# Environment Variables

This document describes all environment variables used in the beton-ai project.

## Backend Environment Variables

### Database & Core Services

```bash
# PostgreSQL Database
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/beton_ai

# Supabase Authentication
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT
JWT_SECRET=your_jwt_secret_key_here

# Server
PORT=3001
NODE_ENV=development
```

### Redis Configuration

```bash
# Redis for Bull Queue
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Bulk Download Configuration

```bash
# Bulk Download Settings
BULK_DOWNLOAD_WARNING_THRESHOLD=1000
MAX_CONCURRENT_JOBS_PER_USER=2
MAX_RETRY_ATTEMPTS=3
APOLLO_API_DELAY_MS=1000
PROGRESS_UPDATE_INTERVAL=10
```

### Apollo Configuration

```bash
# Apollo Global Mode
APOLLO_MODE=mock
# Options: 
# - mock: All Apollo requests go to mock service
# - real: All Apollo requests go to real Apollo API  
# - mixed: Depends on endpoint configuration in apollo.json

# Apollo Endpoint-Specific Overrides (optional)
# These override the global APOLLO_MODE for specific endpoints
APOLLO_API_V1_AUTH_HEALTH_MODE=real
APOLLO_API_V1_MIXED_PEOPLE_SEARCH_MODE=mock

# Mock Apollo Service Configuration
MOCK_APOLLO_SERVICE_URL=http://mock-apollo:3002
MOCK_APOLLO_SERVICE_TIMEOUT=30000
```

## Frontend Environment Variables

```bash
# Supabase (Public)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Endpoints
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws
```

## Mock Apollo Service Environment Variables

```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres123@postgres:5432/mock_apollo
# For development: postgresql://postgres:postgres123@localhost:5432/mock_apollo_dev

# Server Configuration
PORT=3002
NODE_ENV=development

# Logging
LOG_LEVEL=info
# Options: error | warn | info | debug

# Latency Simulation (fallback defaults, stored in database)
BASE_LATENCY_MIN=200
BASE_LATENCY_MAX=800
PER_RECORD_LATENCY=2
PER_PAGE_LATENCY=10

# Data Seeding
SEED_ENTITY_COUNT=100000

# Health Check
HEALTH_CHECK_TIMEOUT=5000
```

## Environment Files

### Development

- **Backend**: Copy `backend/env.example` to `backend/.env`
- **Frontend**: Copy `frontend/env.local.example` to `frontend/.env.local`
- **Mock Apollo**: Copy `mock-apollo/env.example` to `mock-apollo/.env`

### Docker Compose

Environment variables are automatically set in `docker-compose.yml` and `docker-compose.dev.yml`.

## Apollo Configuration Examples

### Development Mode (Use Mock Data)

```bash
export APOLLO_MODE=mock
./dev.sh
# Choose your mode and include mock Apollo service
```

### Production Mode (Use Real Apollo API)

```bash
export APOLLO_MODE=real
# Ensure Apollo API keys are configured in integrations
```

### Mixed Mode (Health=Real, Search=Mock)

```bash
export APOLLO_MODE=mixed
export APOLLO_API_V1_AUTH_HEALTH_MODE=real
export APOLLO_API_V1_MIXED_PEOPLE_SEARCH_MODE=mock
```

### Runtime Configuration

```bash
# Check current configuration
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/apollo/config

# Change mode at runtime
curl -X PUT http://localhost:3001/api/apollo/config/mode \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"mode": "mock"}'
```

## Environment Variable Priority

1. **System Environment Variables** (highest priority)
2. **Docker Compose environment** 
3. **`.env` files**
4. **Configuration files** (e.g., `apollo.json`)
5. **Default values** (lowest priority)

## Security Notes

- Never commit `.env` files to version control
- Use strong, unique values for `JWT_SECRET`
- Keep Supabase service role keys secure
- Use environment-specific API keys for Apollo 