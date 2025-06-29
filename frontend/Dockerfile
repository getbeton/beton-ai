# syntax=docker/dockerfile:1.4

# Base stage with common dependencies
FROM node:18-alpine AS base
RUN apk add --no-cache libc6-compat curl dumb-init
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
    # Install dev dependencies for building
    npm ci --only=dev

# Build stage with ultra-fast optimizations
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
# Copy environment file first
COPY .env.local ./
COPY . .

# Set environment variables for build optimization
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_SHARP_PATH=/app/node_modules/sharp
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Ultra-fast build optimizations with multiple cache mounts
RUN --mount=type=cache,target=/app/.next/cache \
    --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/root/.cache \
    --mount=type=cache,target=/tmp \
    set -a && \
    . ./.env.local && \
    set +a && \
    # Enable build cache and parallel builds with optimizations
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_OPTIONS="--max-old-space-size=2048" \
    npm run build

# Production stage
FROM base AS production
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=1024"

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Create empty public directory (no static assets in this project)
RUN mkdir -p ./public

# Set correct permissions for prerender cache
RUN mkdir .next && chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || curl -f http://localhost:3000 || exit 1

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"] 