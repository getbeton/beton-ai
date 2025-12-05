# Railway Decoupled Services Deployment Guide

## 🎯 Independent Service Architecture

Your services will be **completely independent** with:
- ✅ **Separate deployments** - each service scales independently
- ✅ **Independent environment variables** - no shared config
- ✅ **Isolated failures** - one service failure doesn't affect others
- ✅ **Independent versioning** - deploy backend/frontend separately

## 🚀 Railway Setup (10 minutes)

### Step 1: Create Backend Service
1. Go to [railway.app](https://railway.app) → "New Project"
2. Select "Deploy from GitHub repo" → Choose `beton-ai`
3. **Service Name**: `beton-ai-backend`
4. **Root Directory**: `/backend`
5. Railway will detect and use `backend/Dockerfile`

### Step 2: Create Frontend Service  
1. In same Railway project, click "+" → "GitHub Repo"
2. Select the same `beton-ai` repository
3. **Service Name**: `beton-ai-frontend`  
4. **Root Directory**: `/frontend`
5. Railway will detect and use `frontend/Dockerfile`

### Step 3: Add Shared Databases
1. **PostgreSQL**: Click "+" → "Database" → "Add PostgreSQL"
2. **Redis**: Click "+" → "Database" → "Add Redis"

## 🔧 Service Configuration

### Backend Service Environment Variables
```bash
# Database & Cache
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PORT=${{Redis.REDIS_PORT}}

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Security
JWT_SECRET=your-super-secret-jwt-key-minimum-32-chars

# Service Config
PORT=3001
NODE_ENV=production

# Apollo API Base URL (optional override if you proxy requests)
APOLLO_BASE_URL=https://api.apollo.io

## 🌐 Service URLs After Deployment

Each service gets its own domain:
- **Frontend**: `https://beton-ai-frontend-production.up.railway.app`
- **Backend API**: `https://beton-ai-backend-production.up.railway.app`  

## 💡 Benefits of This Architecture

### 🔄 Independent Deployments
```bash
# Deploy only backend
git push origin main
# Railway automatically detects changes in /backend and deploys only that service

# Deploy only frontend  
git push origin main
# Railway automatically detects changes in /frontend and deploys only that service
```

### 📊 Independent Scaling
- **Backend**: Can scale to handle API load independently
- **Frontend**: Can scale for high traffic independently

### 🛡️ Fault Isolation
- Frontend issues don't affect backend API
- Backend issues don't affect frontend serving
- Database issues are isolated to affected services only

### 💰 Cost Optimization
| Service | Base Cost | Scaling Cost |
|---------|-----------|--------------|
| Backend | $5/month | Per request |
| Frontend | $5/month | Per visitor |
| PostgreSQL | $5/month | Per GB |
| Redis | $3/month | Per GB |

## 🔧 Advanced Configuration

### Custom Build Commands (if needed)
Add to each service's Railway settings:

**Backend Custom Build:**
```bash
# Railway Settings → Backend Service → Settings → Build Command
npm ci --only=production && npm run build && npx prisma generate
```

**Frontend Custom Build:**
```bash
# Railway Settings → Frontend Service → Settings → Build Command  
npm ci && npm run build
```

### Custom Start Commands
**Backend:**
```bash
# Railway Settings → Backend Service → Settings → Start Command
./start.sh
```

**Frontend:**
```bash
# Railway Settings → Frontend Service → Settings → Start Command
npm start
```

## 🚀 Deployment Flow

1. **Code Change**: Make changes to any service directory
2. **Git Push**: `git push origin main`
3. **Auto-Detection**: Railway detects which services changed
4. **Independent Deploy**: Only changed services redeploy
5. **Zero Downtime**: Other services continue running

## 🔍 Monitoring & Debugging

Each service has independent:
- **Logs**: Railway Dashboard → Service → Logs
- **Metrics**: CPU, Memory, Response time per service
- **Environment**: Variables, secrets per service
- **Deployments**: History and rollback per service

## 🎯 Production Checklist

### Backend Service
- [ ] Database connection working
- [ ] Redis connection working  
- [ ] Health endpoint `/health` responding
- [ ] Prisma migrations completed
- [ ] WebSocket connections working
- [ ] File uploads working

### Frontend Service
- [ ] Static assets loading
- [ ] API calls to backend working
- [ ] Authentication flow working
- [ ] Environment variables loaded
- [ ] Routing working correctly

## 🆘 Troubleshooting

### Service Won't Start
1. Check Railway logs for the specific service
2. Verify environment variables are set correctly
3. Test the service locally with same environment

### Services Can't Communicate  
1. Use Railway's internal URLs: `${{ServiceName.RAILWAY_PRIVATE_DOMAIN}}`
2. Check firewall/networking settings
3. Verify environment variables point to correct services

### Database Connection Issues
1. Verify `DATABASE_URL` format is correct
2. Check if migrations ran successfully
3. Test connection from Railway console

This setup gives you **enterprise-grade service separation** while keeping the convenience of a monorepo! 🚀 