# Development Guide

This guide explains how to set up a fast development environment for Beton-AI with real-time code changes.

## 🚀 Quick Start (Recommended)

The fastest way to develop is to run backend services in Docker and frontend locally:

```bash
# Option 1: Use the development script
./dev.sh

# Option 2: Manual setup
docker-compose up postgres backend -d
cd frontend && npm run dev
```

This gives you:
- ✅ **Instant hot reload** - Changes reflect immediately
- ✅ **Fast builds** - No Docker rebuild needed
- ✅ **Full debugging** - Direct access to Next.js dev tools
- ✅ **Backend services** - Database and API running in Docker

## 🐳 Docker Development Mode

If you prefer everything in Docker with hot reload:

```bash
# Start with development compose file
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --watch

# Or build development target
docker-compose -f docker-compose.dev.yml up --build
```

## 📁 Development Workflow

### Frontend Changes
1. Edit files in `frontend/src/`
2. Save the file
3. Changes appear instantly at `http://localhost:3000`

### Backend Changes
1. Edit files in `backend/src/`
2. Restart backend: `docker-compose restart backend`
3. Or use nodemon for auto-restart (add to backend package.json)

### Database Changes
1. Edit `backend/prisma/schema.prisma`
2. Generate migration: `docker-compose exec backend npx prisma migrate dev`
3. Apply changes: `docker-compose restart backend`

## 🔧 Environment Setup

### Frontend (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Backend (.env)
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/beton_ai
JWT_SECRET=your_jwt_secret
```

## 🎯 Development URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Database**: postgresql://localhost:5432

## 🛠 Useful Commands

```bash
# Reset everything and start fresh
docker-compose down --volumes
./setup-db.sh

# View logs
docker-compose logs -f backend
docker-compose logs -f postgres

# Access database
docker-compose exec postgres psql -U postgres -d beton_ai

# Install new frontend dependencies
cd frontend && npm install package-name
```

## 🚨 Troubleshooting

### Port Already in Use
```bash
# Kill processes on ports
sudo lsof -ti:3000 | xargs kill -9
sudo lsof -ti:3001 | xargs kill -9
```

### Database Connection Issues
```bash
# Restart database
docker-compose restart postgres

# Check database status
docker-compose exec postgres pg_isready
```

### Frontend Won't Start
```bash
# Clear Next.js cache
cd frontend && rm -rf .next

# Reinstall dependencies
cd frontend && rm -rf node_modules && npm ci
``` 

## ☁️ Railway Deployments (Local Only)

Use the Railway CLI strictly on your local machine to inspect remote deployments. Do not commit any Railway CLI artifacts or configuration files.

### Install the Railway CLI
- **Homebrew** (preferred on macOS): `brew install railwayapp/tap/railway`
- **Installer script** (fallback): `curl -fsSL https://railway.app/install.sh | sh`

Verify the binary is on your `PATH` and up to date:

```bash
railway --version
```

### Authenticate Locally

```bash
# Opens your browser to complete login; stores credentials in ~/.railway
railway login

# Confirm which account is active
railway whoami
```

Credentials never leave your workstation. If you script access tokens, store them in your password manager—never in the repository.

### Link to an Existing Deployment
1. In the Railway dashboard, copy the project ID and environment name you need to inspect.
2. In the repo root, link your local checkout (creates a `.railway` directory—keep it untracked).

```bash
railway link --project <project_id> --environment <env_name>

# Optional: verify the linked services
railway status
```

To unlink when finished, run `railway unlink`.

### Tail Logs for Troubleshooting

```bash
# Stream all services in the linked environment
railway logs --environment <env_name>

# Narrow to a single service (e.g. backend)
railway logs --service backend --environment <env_name>

# Fetch historical logs if needed
railway logs --service backend --since 1h
```

Pipe or redirect the output locally if you need to save a snapshot:

```bash
railway logs --service backend --since 1h > ~/Desktop/backend-railway.log
```

Always unlink or sign out when you finish a debugging session:

```bash
railway unlink
railway logout
```

### Keep Railway Files Local

Add `.railway/`, `railway.json`, and other CLI artifacts to your global or workspace `.gitignore`. Confirm `git status` stays clean before committing.