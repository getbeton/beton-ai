# Development Setup & Deployment

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- PostgreSQL (if running locally)

### 🚀 **First Time Setup (Recommended)**

For new users, use our automated setup script:

```bash
git clone https://github.com/getbeton/beton-ai.git
cd beton-ai
./setup.sh
```

This script will:
- ✅ Create all environment files automatically
- ✅ Install dependencies
- ✅ Build and start backend, frontend, PostgreSQL, and Redis services
- ✅ Run database migrations
- ✅ Start the complete development environment

**Services will be available at:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### 🔧 **Development Mode Selection**

Use the interactive development script:

```bash
./dev.sh
```

Choose your preferred development mode:
- **Option 1**: Full Docker (recommended for first-time setup)
- **Option 2**: Frontend Dev + Backend Docker (hot reload frontend)
- **Option 3**: Backend Dev + Frontend Docker (hot reload backend)  
- **Option 4**: Both Dev (hot reload both services)
- **Configure Apollo**: Provide your real API key inside the Integrations UI after signing in

### Manual Environment Setup (Alternative)

If you prefer manual setup:

**Backend (.env in /backend):**
```env
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/beton_ai
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret
PORT=3001
```

**Frontend (.env.local in /frontend):**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Manual Database Setup:**
```bash
# Copy environment files
cp backend/env.example backend/.env
cp frontend/env.local.example frontend/.env.local

# Start PostgreSQL
docker-compose up -d postgres

# Run migrations
docker-compose run --rm backend npx prisma migrate deploy

# Start all services
docker-compose up
```

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Build and start all services
npm run docker:build
npm run docker:up

# Stop all services
npm run docker:down
```

### Manual Docker Commands

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🌐 Ports

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 🗄️ Database Management

### Prisma Commands (via Docker)

```bash
# View database with Prisma Studio
docker-compose run --rm backend npx prisma studio --browser none

# Generate Prisma client
docker-compose run --rm backend npx prisma generate

# Deploy migrations (production)
docker-compose run --rm backend npx prisma migrate deploy

# Create new migration (development)
docker-compose run --rm backend npx prisma migrate dev

# Reset database (⚠️ destructive)
docker-compose run --rm backend npx prisma migrate reset
```

### Database Health Check

The PostgreSQL container includes health checks that ensure the database is ready before the backend starts. The backend startup script will:

1. Wait for PostgreSQL to be healthy
2. Automatically run migrations on startup
3. Start the Express server

This ensures consistent database state across all environments.
