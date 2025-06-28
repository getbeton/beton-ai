import { BreadcrumbCache } from '../services/breadcrumbCache';

async function main() {
  try {
    console.log('🔄 Starting breadcrumb cache generation...');
    
    // Check if cache already exists
    const stats = await BreadcrumbCache.getCacheStats();
    
    if (stats.total > 0) {
      console.log(`📊 Breadcrumb cache already exists (${stats.total} entries)`);
      console.log('Cache categories:', stats.categories);
      
      // Ask if we should refresh the cache
      const shouldRefresh = process.env.FORCE_REFRESH_CACHE === 'true';
      
      if (shouldRefresh) {
        console.log('🔄 Force refresh enabled - clearing and regenerating cache...');
        await BreadcrumbCache.clearCache();
        await BreadcrumbCache.generateAllBreadcrumbs();
      } else {
        console.log('✅ Using existing cache (set FORCE_REFRESH_CACHE=true to regenerate)');
      }
    } else {
      console.log('📦 No existing cache found - generating fresh cache...');
      await BreadcrumbCache.generateAllBreadcrumbs();
    }
    
    // Show final stats
    const finalStats = await BreadcrumbCache.getCacheStats();
    console.log(`✅ Breadcrumb cache ready! Total entries: ${finalStats.total}`);
    finalStats.categories.forEach((cat: { category: string; count: number }) => {
      console.log(`  - ${cat.category}: ${cat.count} entries`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to generate breadcrumb cache:', error);
    process.exit(1);
  }
}

main(); 