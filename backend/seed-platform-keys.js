const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedPlatformKeys() {
  console.log('🌱 Seeding platform API keys...');

  try {
    // Create platform key for Apollo
    const apolloKey = await prisma.platformApiKey.create({
      data: {
        serviceName: 'apollo',
        apiKey: 'demo-apollo-key-12345', // Demo key
        description: 'Apollo GraphQL API key with full features',
        rateLimit: 10000,
        usageCount: 0
      }
    });

    // Create platform key for OpenAI
    const openaiKey = await prisma.platformApiKey.create({
      data: {
        serviceName: 'openai',
        apiKey: 'demo-openai-key-abcdef', // Demo key
        description: 'OpenAI API access for text generation',
        rateLimit: 500,
        usageCount: 0
      }
    });

    // Create platform key for GitHub
    const githubKey = await prisma.platformApiKey.create({
      data: {
        serviceName: 'github',
        apiKey: 'demo-github-token-xyz123', // Demo key
        description: 'GitHub API access for repository operations',
        rateLimit: 5000,
        usageCount: 0
      }
    });

    console.log('✅ Successfully created platform keys:');
    console.log(`   - Apollo: 1 key`);
    console.log(`   - OpenAI: 1 key`);
    console.log(`   - GitHub: 1 key`);

    // Display the created keys
    const allKeys = await prisma.platformApiKey.findMany({
      orderBy: { serviceName: 'asc' }
    });

    console.log('\n📋 Platform Keys Summary:');
    allKeys.forEach(key => {
      console.log(`   ${key.serviceName.toUpperCase()}: ${key.description || 'No description'} (${key.rateLimit}/day, ${key.usageCount} users)`);
    });

  } catch (error) {
    console.error('❌ Error seeding platform keys:', error);
    
    if (error.code === 'P2002') {
      console.log('💡 Platform keys already exist. Skipping...');
    } else {
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedPlatformKeys()
  .then(() => {
    console.log('\n🎉 Platform key seeding completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  }); 