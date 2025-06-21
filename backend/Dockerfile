FROM node:18-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl openssl-dev

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Copy startup script and make it executable
COPY start.sh ./
RUN chmod +x start.sh

# Expose port
EXPOSE 3001

# Use startup script instead of direct npm start
CMD ["./start.sh"] 