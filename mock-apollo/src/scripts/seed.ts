#!/usr/bin/env tsx

import { SeedService } from '../services/seedService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Starting Mock Apollo database seeding...');
    
    // Seed the database
    await SeedService.seedDatabase();
    
    console.log('✅ Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
main(); 