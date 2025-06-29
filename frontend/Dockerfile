# syntax=docker/dockerfile:1.4

# Base stage with common dependencies
FROM node:18.19-alpine3.19 AS base
RUN apk add --no-cache libc6-compat curl dumb-init
WORKDIR /app

# Dependencies stage - only rebuild when package files change
FROM base AS deps
# Copy package files first for better caching
COPY package*.json ./
# Install dependencies with advanced cache mounts
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/root/.cache \
    # Install production dependencies first for faster builds
    npm ci --only=production --no-optional && \
    # Install dev dependencies for building
    npm ci --only=dev

# Build stage with optimizations
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
# Copy config files needed for build
COPY next.config.js ./
COPY postcss.config.js ./
COPY tailwind.config.js ./
COPY tsconfig*.json ./
COPY components.json ./
# Copy environment file first
COPY .env.local ./
# Then copy the rest of the source
COPY . .

# Set environment variables for build optimization
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_SHARP_PATH=/app/node_modules/sharp
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Build optimizations with multiple cache mounts
RUN --mount=type=cache,target=/app/.next/cache \
    --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/root/.cache \
    --mount=type=cache,target=/tmp \
    set -a && \
    . ./.env.local && \
    set +a && \
    # Enable build cache and parallel builds
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
COPY --from=builder --chown=nextjs:nodejs /app/.env.local ./

# Clean up unnecessary files
RUN find . -type f -name "*.map" -delete && \
    find . -type d -name "doc" -exec rm -rf {} + 2>/dev/null || true && \
    find . -type d -name "docs" -exec rm -rf {} + 2>/dev/null || true && \
    find . -type d -name "example" -exec rm -rf {} + 2>/dev/null || true && \
    find . -type d -name "examples" -exec rm -rf {} + 2>/dev/null || true

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