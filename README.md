# Beton-AI

An open-source automation platform that helps teams streamline their workflows and manage API integrations efficiently.

## 🚀 Tech Stack

- **Frontend**: Next.js 14, TypeScript, TailwindCSS
- **Backend**: Express.js, TypeScript, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: Supabase (Google, GitHub, Email/Password)
- **Mock Services**: Standalone Apollo API mock with 100K entities
- **Containerization**: Docker & Docker Compose

## 📋 Features

- 🔐 **Secure Authentication** - Multiple sign-in options via Supabase
- 🔑 **API Key Management** - Store and manage API keys for various services
- 🎨 **Modern UI** - Clean, professional interface for both technical and sales teams
- 🎭 **Mock Apollo Service** - Standalone service with 100K mock entities for development
- 🐳 **Docker Ready** - Full containerization support with automated database setup
- 🔄 **Real-time Updates** - Dynamic page refreshing after changes

## 🎭 Mock Apollo Service

This project includes a standalone Apollo API mock service for development:

- **📊 100K Mock Entities** - Pre-seeded with realistic people, organizations, and locations
- **🔧 Separate Database** - Uses its own `mock_apollo` PostgreSQL database
- **⚡ Configurable Latency** - Simulates real-world API response times
- **🔀 Smart Routing** - Backend automatically routes between mock/real Apollo APIs
- **🚀 Auto-Setup** - Database and data seeding handled automatically

The mock service runs on port 3002 and provides Apollo-compatible endpoints for development without requiring real API keys.

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
- ✅ Build and start all Docker services
- ✅ Create separate `mock_apollo` database
- ✅ Seed 100K mock entities for development
- ✅ Start the complete development environment

**Services will be available at:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Mock Apollo: http://localhost:3002
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
- **Include Mock Apollo**: **Yes** (recommended for development)

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

## 📁 Project Structure

```
beton-ai/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── services/       # Business logic
│   │   └── types/          # TypeScript definitions
│   ├── prisma/             # Database schema and migrations
│   └── Dockerfile
├── frontend/               # Next.js application
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # Reusable components
│   │   ├── lib/          # Utilities and configurations
│   │   └── types/        # TypeScript definitions
│   └── Dockerfile
└── docker-compose.yml     # Multi-container configuration
```

## 🎨 Design System (shadcn/ui + Tailwind)

- Tokens live in `frontend/src/app/globals.css` and are mapped in `frontend/tailwind.config.js`.
- UI primitives are in `frontend/src/components/ui` and follow shadcn/ui patterns.
- Typography primitives: `frontend/src/components/ui/typography.tsx`.
- Explore the live component showcase at `/design-system` when running the frontend.

For Figma-to-code mapping and detailed rules, see `.cursor/rules/design_system_rules.mdc`.

## 🔧 Available Scripts

- `npm run dev` - Start both frontend and backend in development
- `npm run build` - Build both applications for production
- `npm run start` - Start both applications in production mode
- `npm run docker:build` - Build Docker images
- `npm run docker:up` - Start with Docker Compose
- `npm run docker:down` - Stop Docker containers

## 🌐 Ports

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Mock Apollo**: http://localhost:3002
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

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details. 
