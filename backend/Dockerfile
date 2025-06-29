# syntax=docker/dockerfile:1.4

# Base stage with common dependencies
FROM node:18-alpine AS base
RUN apk add --no-cache openssl openssl-dev libc6-compat dumb-init curl postgresql-client
WORKDIR /app

# Dependencies stage - only rebuild when package files change
FROM base AS deps
# Copy package files first for better caching
COPY package*.json ./
# Install dependencies with cache mount for better performance
# Optimized dependency installation
RUN --mount=type=cache,target=/root/.npm \
    # Install production dependencies first
    npm ci --only=production && \
    # Keep a copy of production dependencies
    cp -R node_modules /tmp/node_modules && \
    # Install dev dependencies for building
    npm ci --only=dev

# Build stage with optimizations
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build optimizations
ENV NODE_ENV=production
ENV PRISMA_GENERATE_DATAPROXY=true

# Generate Prisma client with cache
RUN --mount=type=cache,target=/root/.cache/prisma \
    npx prisma generate

# Build TypeScript with optimizations
RUN npm run build

# Production stage
FROM base AS production
ENV NODE_ENV=production

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