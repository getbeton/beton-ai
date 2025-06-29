# syntax=docker/dockerfile:1.4

# Base stage with common dependencies
FROM node:18-alpine AS base
RUN apk add --no-cache openssl openssl-dev libc6-compat dumb-init curl postgresql-client
WORKDIR /app

# Dependencies stage - only rebuild when package files change
FROM base AS deps
# Copy package files first for better caching
COPY package*.json ./
# Install dependencies with advanced cache mounts for ultra-fast builds
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/root/.cache \
    # Install production dependencies first for faster builds
    npm ci --only=production && \
    # Keep a copy of production dependencies
    cp -R node_modules /tmp/node_modules && \
    # Install dev dependencies for building
    npm ci --only=dev

# Build stage with ultra-fast optimizations
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build optimizations with advanced caching
ENV NODE_ENV=production
ENV PRISMA_GENERATE_DATAPROXY=true
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Generate Prisma client with advanced cache
RUN --mount=type=cache,target=/root/.cache/prisma \
    --mount=type=cache,target=/root/.cache \
    npx prisma generate

# Build TypeScript with optimizations
RUN --mount=type=cache,target=/root/.cache \
    --mount=type=cache,target=/tmp \
    NODE_OPTIONS="--max-old-space-size=2048" \
    npm run build

# Production stage
FROM base AS production
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=1024"

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 backend

# Copy production dependencies
COPY --from=deps /tmp/node_modules ./node_modules
# Copy built application
COPY --from=builder /app/dist ./dist
# Copy necessary files
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/config ./config
COPY --from=builder /app/package*.json ./
COPY start.sh ./
RUN chmod +x start.sh

# Set correct permissions
RUN chown -R backend:nodejs /app
USER backend

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3001/health || curl -f http://localhost:3001 || exit 1

EXPOSE 3001

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["./start.sh"] 