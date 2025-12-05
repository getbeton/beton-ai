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
# Apollo Base URL (override if you proxy Apollo via your backend)
APOLLO_BASE_URL=https://api.apollo.io
```

## Frontend Environment Variables

```bash
# Supabase (Public)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Endpoints
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws

# Analytics (Optional)
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_project_api_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

## Environment Files

### Development

- **Backend**: Copy `backend/env.example` to `backend/.env`
- **Frontend**: Copy `frontend/env.local.example` to `frontend/.env.local`

### Docker Compose

Environment variables are automatically set in `docker-compose.yml` and `docker-compose.dev.yml`.

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
- PostHog keys are public but should still be managed carefully

## Important Changes

### Mock Apollo Service Removed
The mock Apollo service (`mock-apollo/`) has been completely removed. All Apollo API calls now use the real Apollo API endpoints. Make sure to:
1. Remove any references to mock Apollo service from your environment
2. Configure your Apollo API key via the Integrations page
3. Update any documentation or scripts that referenced the mock service 