# Railway Deployment Guide for Beton-AI

## 🚀 Quick Deployment (5 minutes)

### Step 1: Create Railway Project
1. Go to [railway.app](https://railway.app) and sign up with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `beton-ai` repository
4. Railway will detect your Docker services automatically

### Step 2: Add Database Services
In your Railway dashboard:
1. Click "Add Service" → "Database" → "Add PostgreSQL"
2. Click "Add Service" → "Database" → "Add Redis"
3. Railway will provide connection strings automatically

### Step 3: Configure Environment Variables

#### Backend Service Environment Variables
In Railway Dashboard → Backend Service → Variables, add:

```bash
# Database (Railway auto-provides these)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (Railway auto-provides these)
REDIS_URL=${{Redis.REDIS_URL}}
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PORT=${{Redis.REDIS_PORT}}

# Supabase (Get from your Supabase dashboard)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Security (generate a random 32+ character string)
JWT_SECRET=your-super-secret-jwt-key-32-characters-minimum

# Service Config
PORT=3001
NODE_ENV=production

# Inter-service URLs (Railway auto-provides)
MOCK_APOLLO_SERVICE_URL=${{MockApollo.RAILWAY_STATIC_URL}}

# Performance (optional - uses defaults if not set)
APOLLO_MODE=mixed
BULK_DOWNLOAD_WARNING_THRESHOLD=1000
```

#### Frontend Service Environment Variables
In Railway Dashboard → Frontend Service → Variables, add:

```bash
# Supabase (same as backend)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Backend API URL (Railway auto-provides)
NEXT_PUBLIC_API_URL=${{Backend.RAILWAY_STATIC_URL}}
NEXT_PUBLIC_WS_URL=${{Backend.RAILWAY_STATIC_URL}}/ws

# Next.js Config
NODE_ENV=production
```

#### Mock Apollo Service Environment Variables
In Railway Dashboard → MockApollo Service → Variables, add:

```bash
# Database (create separate PostgreSQL for mock data)
DATABASE_URL=${{MockPostgres.DATABASE_URL}}

# Service Config
NODE_ENV=production
PORT=3002
```

### Step 4: Deploy Services
1. **Backend**: Railway auto-deploys when you push to GitHub
2. **Frontend**: Railway auto-deploys when you push to GitHub  
3. **Mock Apollo**: Railway auto-deploys when you push to GitHub
4. **Databases**: PostgreSQL and Redis are automatically managed

### Step 5: Run Database Migrations
After backend deploys successfully:
1. Go to Backend Service → Deploy Logs
2. Check if Prisma migrations ran automatically
3. If not, you can trigger them via Railway's console

## 🔧 Service Configuration

### Service Detection
Railway will automatically detect these services from your repo:
- **Frontend** (from `/frontend` directory)
- **Backend** (from `/backend` directory)  
- **Mock Apollo** (from `/mock-apollo` directory)

### Networking
Railway provides internal networking between services:
- Services can communicate via `${{ServiceName.RAILWAY_PRIVATE_DOMAIN}}`
- External access via `${{ServiceName.RAILWAY_STATIC_URL}}`

### Domains
Railway provides:
- Auto-generated domains: `yourapp-production.up.railway.app`
- Custom domain support (upgrade required)

## 💰 Estimated Monthly Cost

| Service | Cost |
|---------|------|
| Backend Service | $5-10/month |
| Frontend Service | $5-10/month |
| Mock Apollo Service | $5/month |
| PostgreSQL (Main) | $5/month |
| PostgreSQL (Mock) | $5/month |
| Redis | $3/month |
| **Total** | **~$28-38/month** |

*First month often free with Railway credits*

## 🔧 Common Setup Issues & Solutions

### Issue: Database Connection Fails
**Solution**: Ensure `DATABASE_URL` uses Railway's provided connection string

### Issue: Services Can't Communicate
**Solution**: Use Railway's internal URLs:
```bash
# Instead of localhost:3002
MOCK_APOLLO_SERVICE_URL=${{MockApollo.RAILWAY_PRIVATE_DOMAIN}}
```

### Issue: Build Fails
**Solution**: Check that each service has its own `railway.json` configuration

### Issue: Environment Variables Not Loading
**Solution**: 
1. Double-check variable names in Railway dashboard
2. Redeploy after adding variables
3. Check Railway's variable reference format: `${{ServiceName.VARIABLE}}`

## 🚀 Going Live Checklist

- [ ] All services deployed successfully
- [ ] Database migrations completed
- [ ] Environment variables configured
- [ ] Frontend can reach backend API
- [ ] Backend can reach databases
- [ ] Mock Apollo service responding
- [ ] File uploads working
- [ ] WebSocket connections established
- [ ] Supabase authentication working

## 📞 Need Help?
- Railway Discord: discord.gg/railway
- Railway Docs: docs.railway.app
- This setup should work with your existing Docker configuration! 