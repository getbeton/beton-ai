# Multi-stage build for optimization
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install curl for health checks, postgresql-client for database setup, and openssl for Prisma
RUN apk add --no-cache curl postgresql-client openssl openssl-dev

# Set OpenSSL environment for Prisma compatibility
ENV OPENSSL_CONF=/etc/ssl/

# Copy dependencies and generated code
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Copy application source
COPY . .

# Make setup script executable
RUN chmod +x setup.sh

# Install dev dependencies and build
RUN npm install tsx typescript --save-dev && \
    npm run build && \
    npm prune --production

# Regenerate Prisma client with proper OpenSSL settings
RUN npx prisma generate

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S apollo -u 1001

# Change ownership
RUN chown -R apollo:nodejs /app
USER apollo

EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3002/health || exit 1

# Start with database initialization and server
CMD ["./setup.sh"] 