import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixCollationVersion() {
  try {
    console.log('🔧 Fixing PostgreSQL collation version mismatch...');

    // Execute the raw SQL to refresh collation version
    await prisma.$executeRawUnsafe('ALTER DATABASE railway REFRESH COLLATION VERSION;');

    console.log('✅ Collation version refreshed successfully!');
    console.log('The collation mismatch warnings should now stop.');
  } catch (error) {
    console.error('❌ Error fixing collation version:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixCollationVersion()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
