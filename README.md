# Beton-AI

An open-source automation platform that helps teams streamline their workflows and manage API integrations efficiently.

## 🚀 Tech Stack

- **Frontend**: Next.js 14, TypeScript, TailwindCSS, COSS UI Components
- **Backend**: Express.js, TypeScript, Prisma ORM, ESLint
- **Database**: PostgreSQL
- **Queue System**: Bull Queue with Redis
- **Authentication**: Supabase (Google, GitHub, Email/Password)
- **Analytics**: PostHog for user behavior tracking
- **Integrations**: Apollo, OpenAI, Findymail APIs
- **Containerization**: Docker & Docker Compose

### UI Components & Design

Beton-AI uses **COSS UI** components - a modern, accessible component library built on Radix UI primitives. The application features:
- **Header-based Navigation** - Clean, responsive top navigation (comp-589) with user menu and settings
- **Consistent Design System** - All UI primitives (buttons, inputs, dialogs, tooltips, etc.) from COSS
- **Analytics Integration** - Built-in PostHog tracking on interactive components
- **Accessibility First** - ARIA labels and keyboard navigation throughout
- **Advanced Table Management** - Powered by @tanstack/react-table with sorting, filtering, and pagination
- **Toast Notifications** - Sonner library for elegant user feedback
- **Drag & Drop Uploads** - Modern file upload with progress tracking

## 📋 Features

- 🔐 **Secure Authentication** - Multiple sign-in options via Supabase (Google, GitHub, Email/Password)
- 🔑 **API Key Management** - Store and manage API keys for various services
- 🎨 **Modern UI** - Header-based navigation with clean, professional interface
- 📊 **Advanced Table Management** - Import, view, filter, sort, and manage data tables with ease
- 📁 **CSV Upload** - Drag-and-drop file uploads with real-time progress tracking
- 📈 **Analytics Dashboard** - PostHog integration for user behavior insights
- 🤝 **Apollo, OpenAI, Findymail Integrations** - Connect with real APIs via secure key storage
- 🐳 **Docker Ready** - Full containerization support with automated database setup
- 🔄 **Real-time Updates** - WebSocket support and dynamic page refreshing
- 🔔 **Toast Notifications** - Elegant user feedback with Sonner
- ⚡ **Background Job Processing** - Bull Queue with Redis for async tasks

## 🤝 Apollo Integration

Beton-AI talks directly to Apollo's public API in all environments. The mock Apollo service has been removed in favor of real API integration. 

**How it works:**
1. Add your Apollo API key securely via the Integrations page
2. The backend validates your key through Supabase-authenticated routes
3. All searches use the real Apollo API with your credentials
4. Background jobs handle bulk downloads with rate limiting and retry logic

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

## 📁 Project Structure

```
beton-ai/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── routes/         # API routes (auth, tables, integrations, etc.)
│   │   ├── middleware/     # Custom middleware (auth, error handling)
│   │   ├── services/       # Business logic (Apollo, OpenAI, Findymail)
│   │   ├── queues/         # Bull Queue jobs (AI tasks, bulk downloads)
│   │   ├── workers/        # Background job workers
│   │   ├── config/         # Configuration files
│   │   └── types/          # TypeScript definitions
│   ├── prisma/             # Database schema and migrations
│   └── Dockerfile
├── frontend/               # Next.js application
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # Reusable components
│   │   │   ├── ui/       # COSS UI components
│   │   │   ├── layout/   # AppShell, DashboardShell
│   │   │   ├── dashboard/ # Dashboard-specific components
│   │   │   ├── navigation/ # Navigation components
│   │   │   └── upload/   # File upload components
│   │   ├── lib/          # Utilities and configurations
│   │   │   ├── analytics.ts    # PostHog helpers
│   │   │   ├── posthog.ts      # PostHog initialization
│   │   │   └── tableTransformers.ts # Data transformers
│   │   ├── hooks/        # Custom React hooks
│   │   └── types/        # TypeScript definitions
│   └── Dockerfile
├── prd/                    # Product requirement documents
├── docker-compose.yml      # Multi-container configuration
└── README.md              # This file
```

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
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 📊 Analytics Integration

Beton-AI uses **PostHog** for analytics and user behavior tracking:

- **Event Tracking** - Captures user interactions across the application
- **Navigation Analytics** - Tracks page visits and navigation patterns
- **UI Component Analytics** - Monitors button clicks, form submissions, and component interactions
- **Privacy First** - Configurable tracking with opt-out support

### PostHog Setup

Add your PostHog API key to the frontend environment:

```env
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

Analytics helpers are available in `frontend/src/lib/analytics.ts`:
- `captureUiEvent()` - Track UI interactions
- `captureNavigation()` - Track navigation events
- `captureLandingAction()` - Track landing page actions

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
