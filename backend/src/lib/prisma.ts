import { PrismaClient } from '@prisma/client';

// Singleton pattern to ensure only one PrismaClient instance exists
// This prevents connection pool exhaustion in serverless/container environments
let prisma: PrismaClient;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
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
