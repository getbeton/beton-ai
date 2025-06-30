# syntax=docker/dockerfile:1.4

# Base stage with common dependencies
FROM node:18-alpine AS base
RUN apk add --no-cache curl postgresql-client openssl openssl-dev libc6-compat dumb-init
WORKDIR /app

# Dependencies stage - only rebuild when package files change
FROM base AS deps
# Copy package files first for better caching
COPY package*.json ./
# Install dependencies (Railway-compatible)
RUN npm ci && \
    # Keep a copy of production dependencies
    npm ci --omit=dev && \
    cp -R node_modules /tmp/node_modules && \
    # Install all dependencies (including dev) for building
    npm ci

# Build stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate
# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM base AS production
ENV NODE_ENV=production
ENV OPENSSL_CONF=/etc/ssl/

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 apollo

# Copy production dependencies and built application
COPY --from=deps /tmp/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./
COPY setup.sh ./
RUN chmod +x setup.sh

# Regenerate Prisma client for production environment
RUN npx prisma generate

# Set correct permissions
RUN chown -R apollo:nodejs /app
USER apollo

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3002/health || exit 1

EXPOSE 3002

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"] 