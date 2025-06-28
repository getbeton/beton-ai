#!/usr/bin/env tsx

import { SeedService } from '../services/seedService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Starting Mock Apollo database seeding...');
    
    // Initialize default configuration
    await initializeConfig();
    
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

async function initializeConfig() {
  console.log('⚙️  Initializing service configuration...');
  
  const defaultConfigs = [
    { key: 'base_latency_min', value: '200', description: 'Minimum base latency in milliseconds' },
    { key: 'base_latency_max', value: '800', description: 'Maximum base latency in milliseconds' },
    { key: 'per_record_latency', value: '2', description: 'Additional latency per record in milliseconds' },
    { key: 'per_page_latency', value: '10', description: 'Additional latency per page in milliseconds' }
  ];
  
  for (const config of defaultConfigs) {
    await prisma.serviceConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config
    });
  }
  
  console.log('⚙️  Service configuration initialized');
}

// Run the seeding
main(); 