# Beton-AI Setup Guide

This guide will help you set up and run the Beton-AI application locally.

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js 18+** and npm
- **Docker** and Docker Compose
- **Git**
- A **Supabase** account (free tier is sufficient)

## Step 1: Supabase Setup

1. Go to [Supabase](https://supabase.com) and create a new account
2. Create a new project
3. Go to **Settings** > **API** and copy:
   - `Project URL`
   - `anon public` key
   - `service_role secret` key (⚠️ Keep this secret!)

4. Go to **Authentication** > **Providers** and enable:
   - Email (enabled by default)
   - Google OAuth (optional but recommended)
   - GitHub OAuth (optional but recommended)

## Step 2: Clone and Install

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone https://github.com/getbeton/beton-ai.git
   cd beton-ai
   ```

2. **Install dependencies** (front- and backend):
   ```bash
   npm run install:all
   ```

3. **Bootstrap the Docker stack (optional but recommended for a full environment)**:
   ```bash
   ./setup.sh
   ```
   This script copies environment templates, builds Docker images, starts the services, and runs database migrations. Append `--clean` if you want to tear down any existing containers and volumes before rebuilding.

## Step 3: Configure Environment Variables

### Backend Configuration (`backend/.env`)

Update the following variables in `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres123@postgres:5432/beton_ai
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_random_jwt_secret_here
PORT=3001
NODE_ENV=development
```

### Frontend Configuration (`frontend/.env.local`)

Update the following variables in `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Step 4: Database Setup

### First Time Setup

When setting up for the first time, the database migration will run automatically. However, if you need to run it manually:

```bash
# Run database migration
docker-compose exec backend npx prisma migrate deploy

# Or if containers aren't running yet
docker-compose run --rm backend npx prisma migrate deploy
```

### Database Schema

The application uses the following database structure:
- **integrations**: Service integrations (Apollo, OpenAI, GitHub, etc.)
- **api_keys**: API keys linked to integrations
- **user_preferences**: User settings and preferences

## Step 5: Run the Application

### Option A: Development Mode (Recommended)

```bash
./dev.sh
```

This will:
- Start PostgreSQL in Docker
- Run database migrations automatically
- Start the backend server on port 3001
- Start the frontend development server on port 3000

### Option B: Docker Mode

```bash
npm run docker:build
npm run docker:up
```

This will build and run everything in Docker containers with automatic database setup.

## Step 6: Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Database**: PostgreSQL on port 5432

## Features

### Authentication
- Sign up with email/password
- Sign in with Google or GitHub
- Password reset functionality
- Secure JWT-based authentication

### Service Integrations
- **Integration Management**: Create integrations for different services (Apollo GraphQL, OpenAI, GitHub)
- **API Key Storage**: Store multiple API keys per integration (platform keys, personal keys)
- **Health Monitoring**: Real-time health checks for your integrations
- **Service Connectors**: Built-in connectors for popular services

### Integration Types
- **Apollo GraphQL**: GraphQL API management and monitoring
- **OpenAI**: AI model integration and usage tracking
- **GitHub**: Repository and API management
- **Custom Services**: Extensible architecture for adding new services

## Troubleshooting

### Common Issues

1. **Docker not running**
   - Make sure Docker Desktop is installed and running
   - Run `docker info` to verify

2. **Port conflicts**
   - Make sure ports 3000, 3001, and 5432 are available
   - Stop other services using these ports

3. **Database connection issues**
   - Ensure PostgreSQL container is running
   - Check if DATABASE_URL is correct
   - Wait a few seconds after starting PostgreSQL
   - Try running: `docker-compose exec backend npx prisma migrate deploy`

4. **Database schema out of sync**
   - Run the migration: `docker-compose exec backend npx prisma migrate deploy`
   - If still having issues: `docker-compose exec backend npx prisma db push`

5. **Supabase authentication not working**
   - Verify your Supabase project settings
   - Check that OAuth providers are configured correctly
   - Ensure environment variables are set correctly

### Reset Everything

If you encounter issues, you can reset the entire setup:

```bash
# Stop all containers and remove volumes
docker-compose down -v

# Remove node_modules
rm -rf node_modules backend/node_modules frontend/node_modules

# Reinstall dependencies
npm run install:all

# Rebuild and start services
./setup.sh --clean

# Relaunch development environment
./dev.sh
```

## Development Commands

```bash
# Install dependencies
npm run install:all

# Provision Docker services and run migrations
./setup.sh

# Run in development mode
./dev.sh

# Run with Docker
npm run docker:build
npm run docker:up

# Backend only
cd backend && npm run dev

# Frontend only
cd frontend && npm run dev

# Database operations
cd backend
npx prisma studio              # Open database browser
npx prisma generate            # Generate Prisma client
npx prisma migrate deploy      # Apply migrations (production)
npx prisma migrate dev         # Create and apply migration (development)
npx prisma db push             # Push schema changes (development)

# Or run from Docker
docker-compose exec backend npx prisma studio
docker-compose exec backend npx prisma migrate deploy
```

## Database Migrations

### For New Developers

When you first clone the project, the migrations will run automatically when you start the application. The initial migration creates:

- `integrations` table for service connections
- `api_keys` table for storing encrypted API keys
- `user_preferences` table for user settings
- Proper foreign key relationships and indexes

### For Existing Developers

When pulling new changes that include database schema updates:

```bash
# Apply new migrations
docker-compose exec backend npx prisma migrate deploy

# If containers aren't running
docker-compose run --rm backend npx prisma migrate deploy
```

### Creating New Migrations

When you modify the Prisma schema:

```bash
# Create and apply a new migration
docker-compose exec backend npx prisma migrate dev --name your_migration_name
```

## Security Notes

- Never commit `.env` files to version control
- Keep your Supabase service role key secret
- API keys are encrypted before storage
- Use HTTPS in production
- Set up proper CORS policies for production
- Database migrations are tracked in version control

## Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review the application logs: `docker-compose logs backend` or `docker-compose logs frontend`
3. Ensure all environment variables are set correctly
4. Try running database migrations manually
5. Try resetting the setup as described above

Happy automating! 🚀 
