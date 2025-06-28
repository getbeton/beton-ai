# Networking Configuration

This document explains how the main application communicates with the mock Apollo service in different environments.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Main App      │    │  Mock Apollo    │    │ Mock PostgreSQL │
│   (Backend)     │────│   Service       │────│   Database      │
│                 │    │                 │    │                 │
│ Port: 3001      │    │ Port: 3002      │    │ Port: 5433      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Environment-Specific Configuration

### 🖥️ **Local Development**

When running the backend locally (using `./dev.sh` options 3, 4, or 5):

```bash
# Main app talks to mock Apollo via localhost
MOCK_APOLLO_SERVICE_URL=http://localhost:3002
```

**Communication Flow:**
- Backend (local) → `http://localhost:3002` → Mock Apollo (Docker)
- Mock Apollo (Docker) → `mock-postgres:5432` → Mock PostgreSQL (Docker)

### 🐳 **Full Docker Environment**

When running everything in Docker (using `./dev.sh` option 1):

```bash
# Docker override in docker-compose.yml
MOCK_APOLLO_SERVICE_URL=http://mock-apollo:3002
```

**Communication Flow:**
- Backend (Docker) → `http://mock-apollo:3002` → Mock Apollo (Docker)
- Mock Apollo (Docker) → `mock-postgres:5432` → Mock PostgreSQL (Docker)

## Service Isolation

### 🗄️ **Database Separation**

```
Main PostgreSQL (port 5432)
└── beton_ai database

Mock PostgreSQL (port 5433)  
└── mock_apollo database
```

### 🔗 **Network Communication**

| Service | Container Name | Host Port | Internal Communication |
|---------|---------------|-----------|----------------------|
| Main Backend | `beton-ai-backend` | 3001 | Uses environment URLs |
| Mock Apollo | `beton-ai-mock-apollo` | 3002 | Always accessible via localhost:3002 |
| Main DB | `beton-ai-postgres` | 5432 | postgres:5432 (internal) |
| Mock DB | `beton-ai-mock-postgres` | 5433 | mock-postgres:5432 (internal) |

## Configuration Priority

The system uses this configuration priority:

1. **Environment Variables** (highest priority)
   - `MOCK_APOLLO_SERVICE_URL`
   - Set automatically by Docker Compose
   - Can be overridden in `.env` files

2. **Configuration Files**
   - `backend/config/apollo.json`
   - Default: `http://localhost:3002`

3. **Fallback**
   - If all else fails, defaults to localhost

## Development Workflows

### 🔄 **Switching Between Environments**

**Local Backend + Mock Docker:**
```bash
./dev.sh  # Choose option 3, 4, or 5
# Backend automatically uses http://localhost:3002
```

**Full Docker:**
```bash
./dev.sh  # Choose option 1
# Backend automatically uses http://mock-apollo:3002
```

### 🛠️ **Manual Configuration**

If you need to override the mock service URL:

```bash
# In backend/.env
MOCK_APOLLO_SERVICE_URL=http://your-custom-url:3002
```

### 🧪 **Testing Communication**

```bash
# Test mock Apollo accessibility
curl http://localhost:3002/health

# Test from within Docker network (if backend is in Docker)
docker exec beton-ai-backend curl http://mock-apollo:3002/health
```

## Troubleshooting

### ❌ **"ENOTFOUND mock-apollo" Error**

**Problem:** Backend running locally but trying to use Docker hostname.

**Solution:** 
```bash
# Check backend/.env file
grep MOCK_APOLLO_SERVICE_URL backend/.env

# Should be:
MOCK_APOLLO_SERVICE_URL=http://localhost:3002

# If wrong, fix it:
sed -i '' 's|http://mock-apollo:3002|http://localhost:3002|g' backend/.env
```

### ❌ **"Connection Refused localhost:3002" Error**

**Problem:** Mock Apollo service not running.

**Solution:**
```bash
# Start mock Apollo services
docker-compose up mock-postgres mock-apollo -d
```

### ❌ **Backend Can't Connect to Mock Service**

**Problem:** Network or configuration issue.

**Debugging Steps:**
```bash
# 1. Check if mock Apollo is running
docker-compose ps | grep mock-apollo

# 2. Test connectivity
curl http://localhost:3002/health

# 3. Check backend logs for exact error
tail -f backend/logs/* 

# 4. Verify environment variables
docker exec beton-ai-backend env | grep MOCK_APOLLO
```

## Security Considerations

- Mock Apollo service should only be accessible in development
- Production deployments should disable mock service entirely
- Use real Apollo API endpoints in production
- Environment variables properly isolate configuration

## Port Summary

| Service | Host Port | Purpose |
|---------|-----------|---------|
| 3000 | Frontend | Web application |
| 3001 | Backend API | Main application API |
| 3002 | Mock Apollo | Apollo API simulation |
| 5432 | Main PostgreSQL | Application database |
| 5433 | Mock PostgreSQL | Mock service database |
| 6379 | Redis | Caching and queues | 