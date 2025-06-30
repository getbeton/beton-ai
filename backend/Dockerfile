# syntax=docker/dockerfile:1.4

# Base stage with common dependencies
FROM node:18.19-alpine3.19 AS base
# Combine RUN commands and clean cache in single layer
RUN apk add --no-cache dumb-init curl postgresql15-client && \
    npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-retries 3 && \
    npm config set fetch-retry-factor 2 && \
    npm config set fetch-retry-mintimeout 10000 && \
    npm config set fetch-retry-maxtimeout 60000
WORKDIR /app

# Dependencies stage - only rebuild when package files change
FROM base AS deps
# Copy package files first for better caching
COPY package*.json ./
# Install dependencies (Railway-compatible - no cache mounts)
RUN npm config set maxsockets 50 && \
    npm config set fetch-timeout 60000 && \
    # Install production dependencies first for faster builds
    NODE_ENV=production npm ci --prefer-offline --no-audit --no-optional && \
    # Keep a copy of production dependencies
    cp -R node_modules /tmp/node_modules && \
    # Install dev dependencies for building
    npm ci --prefer-offline --no-audit

# Build stage with optimizations
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
# Copy config files needed for build
COPY tsconfig*.json ./
COPY nodemon.json ./
COPY config/ ./config/
COPY prisma/ ./prisma/
# Then copy the rest of the source
COPY . .

# Build optimizations with advanced caching
ENV NODE_ENV=production
ENV PRISMA_GENERATE_DATAPROXY=true
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV TS_NODE_TRANSPILE_ONLY=true

# Generate Prisma client (Railway-compatible)
RUN NODE_OPTIONS="--max-old-space-size=4096" \
    npx prisma generate

# Build TypeScript (Railway-compatible)
RUN NODE_OPTIONS="--max-old-space-size=4096" \
    npm run build

# Production stage
FROM base AS production

# Redis configuration - accept as build args and set as env vars
ARG REDIS_HOST
ARG REDIS_PORT
ARG REDIS_URL
ARG DATABASE_URL
ARG JWT_SECRET
ARG SUPABASE_URL
ARG SUPABASE_ANON_KEY
ARG SUPABASE_SERVICE_ROLE_KEY
ARG MOCK_APOLLO_SERVICE_URL

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=2048"
ENV REDIS_HOST=$REDIS_HOST
ENV REDIS_PORT=$REDIS_PORT
ENV REDIS_URL=$REDIS_URL
ENV DATABASE_URL=$DATABASE_URL
ENV JWT_SECRET=$JWT_SECRET
ENV SUPABASE_URL=$SUPABASE_URL
ENV SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
ENV MOCK_APOLLO_SERVICE_URL=$MOCK_APOLLO_SERVICE_URL

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 backend

# Copy only necessary files in optimal order
COPY --from=deps /tmp/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/config/apollo.json ./config/apollo.json
COPY --from=builder /app/package*.json ./
# Copy startup script and make it executable
COPY start.sh ./

# Clean up unnecessary files from node_modules
RUN npm prune --production && \
    find node_modules -type f -name "*.d.ts" -delete && \
    find node_modules -type f -name "*.map" -delete && \
    find node_modules -type d -name "doc" -exec rm -rf {} + 2>/dev/null || true && \
    find node_modules -type d -name "docs" -exec rm -rf {} + 2>/dev/null || true && \
    find node_modules -type d -name "example" -exec rm -rf {} + 2>/dev/null || true && \
    find node_modules -type d -name "examples" -exec rm -rf {} + 2>/dev/null || true && \
    chmod +x start.sh && \
    chown -R backend:nodejs /app

USER backend

# Health check with optimized intervals
HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:3001/health || curl -f http://localhost:3001 || exit 1

EXPOSE 3001

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["./start.sh"] 