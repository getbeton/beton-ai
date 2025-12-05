import { PrismaClient } from '@prisma/client';

// Singleton pattern to ensure only one PrismaClient instance exists
// This prevents connection pool exhaustion in serverless/container environments
let prisma: PrismaClient;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    // Add connection pool limits to prevent "too many clients" errors in Railway
    const databaseUrl = process.env.DATABASE_URL;
    const urlWithPooling = databaseUrl?.includes('?')
      ? `${databaseUrl}&connection_limit=5&pool_timeout=10`
      : `${databaseUrl}?connection_limit=5&pool_timeout=10`;

    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
      datasources: {
        db: {
          url: urlWithPooling,
        },
      },
    });

    // Graceful shutdown
    process.on('beforeExit', async () => {
      await prisma.$disconnect();
    });
  }

  return prisma;
}

// Export a default instance for easy import
const prismaInstance = getPrismaClient();
export default prismaInstance;
