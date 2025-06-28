import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class BreadcrumbCache {
  /**
   * Generate and cache all breadcrumbs for common filter combinations
   */
  static async generateAllBreadcrumbs(): Promise<void> {
    console.log('🔄 Starting breadcrumb cache generation...');
    const startTime = Date.now();

    // Common filter combinations to pre-generate
    const filterCombinations = [
      {}, // No filters - most common case
      // Add more common combinations as needed
    ];

    for (const filters of filterCombinations) {
      await this.generateBreadcrumbsForFilter(filters);
    }

    const totalTime = Date.now() - startTime;
    console.log(`✅ Breadcrumb cache generation completed in ${totalTime}ms`);
  }

  /**
   * Generate breadcrumbs for a specific filter combination
   */
  private static async generateBreadcrumbsForFilter(whereClause: any): Promise<void> {
    const filterKey = JSON.stringify(whereClause);
    console.log(`📊 Generating breadcrumbs for filter: ${filterKey}`);

    try {
      // Generate each breadcrumb category in parallel
      const [
        titleCounts,
        seniorityCounts,
        industryCounts,
        sizeCounts,
        departmentCounts
      ] = await Promise.all([
        this.generateFieldCounts('title', whereClause),
        this.generateFieldCounts('seniority', whereClause),
        this.generateOrganizationFieldCounts('industry', whereClause),
        this.generateOrganizationFieldCounts('size', whereClause),
        this.generateDepartmentCounts(whereClause)
      ]);

      // Store each category in cache
      await Promise.all([
        this.storeBreadcrumbData('person_titles', filterKey, this.formatCounts(titleCounts)),
        this.storeBreadcrumbData('person_seniorities', filterKey, this.formatCounts(seniorityCounts)),
        this.storeBreadcrumbData('organization_industries', filterKey, this.formatCounts(industryCounts)),
        this.storeBreadcrumbData('organization_num_employees_ranges', filterKey, this.formatCounts(sizeCounts)),
        this.storeBreadcrumbData('person_departments', filterKey, this.formatCounts(departmentCounts))
      ]);

      console.log(`✅ Cached breadcrumbs for filter: ${filterKey}`);
    } catch (error) {
      console.error(`❌ Failed to generate breadcrumbs for filter ${filterKey}:`, error);
    }
  }

  /**
   * Get cached breadcrumbs for a filter combination
   */
  static async getCachedBreadcrumbs(whereClause: any): Promise<any> {
    const filterKey = JSON.stringify(whereClause);

    try {
      const cachedData = await prisma.breadcrumbCache.findMany({
        where: { filterKey }
      });

      if (cachedData.length === 0) {
        console.log(`⚠️  No cached breadcrumbs found for filter: ${filterKey}`);
        // Generate on-demand if not cached
        await this.generateBreadcrumbsForFilter(whereClause);
        return this.getCachedBreadcrumbs(whereClause);
      }

      // Convert cached data back to breadcrumb format
      const breadcrumbs: any = {
        signal_names: [],
        person_titles: [],
        person_seniorities: [],
        organization_industries: [],
        organization_num_employees_ranges: [],
        person_departments: [],
        person_locations: [],
        organization_locations: [],
        technologies: []
      };

      cachedData.forEach(item => {
        breadcrumbs[item.category] = JSON.parse(item.data);
      });

      console.log(`📊 Served cached breadcrumbs for filter: ${filterKey}`);
      return breadcrumbs;
    } catch (error) {
      console.error('❌ Error getting cached breadcrumbs:', error);
      // Fallback to empty breadcrumbs
      return {
        signal_names: [],
        person_titles: [],
        person_seniorities: [],
        organization_industries: [],
        organization_num_employees_ranges: [],
        person_departments: [],
        person_locations: [],
        organization_locations: [],
        technologies: []
      };
    }
  }

  /**
   * Store breadcrumb data in cache
   */
  private static async storeBreadcrumbData(category: string, filterKey: string, data: any[]): Promise<void> {
    await prisma.breadcrumbCache.upsert({
      where: {
        category_filterKey: {
          category,
          filterKey
        }
      },
      create: {
        category,
        filterKey,
        data: JSON.stringify(data)
      },
      update: {
        data: JSON.stringify(data),
        updatedAt: new Date()
      }
    });
  }

  /**
   * Generate field counts using efficient queries
   */
  private static async generateFieldCounts(field: string, whereClause: any): Promise<Record<string, number>> {
    const results = await prisma.mockPerson.groupBy({
      by: [field as any],
      where: whereClause,
      _count: true,
      orderBy: { _count: { [field]: 'desc' } },
      take: 20
    });

    return results.reduce((acc, item) => {
      acc[item[field as keyof typeof item] as string] = item._count;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Generate organization field counts
   */
  private static async generateOrganizationFieldCounts(field: string, whereClause: any): Promise<Record<string, number>> {
    // Use the optimized groupBy approach
    const orgGroups = await prisma.mockPerson.groupBy({
      by: ['organizationId'],
      where: whereClause,
      _count: true,
      orderBy: { _count: { organizationId: 'desc' } },
      take: 50
    });

    const orgIds = orgGroups.map(g => g.organizationId);
    const organizations = await prisma.mockOrganization.findMany({
      where: { id: { in: orgIds } },
      select: { 
        id: true, 
        industry: true,
        size: true
      }
    });

    const orgMap = new Map(organizations.map(org => [org.id, org]));
    const counts: Record<string, number> = {};
    
    orgGroups.forEach(group => {
      const org = orgMap.get(group.organizationId);
      if (org) {
        const value = (org as any)[field];
        if (value) {
          counts[value] = (counts[value] || 0) + group._count;
        }
      }
    });

    return counts;
  }

  /**
   * Generate department counts
   */
  private static async generateDepartmentCounts(whereClause: any): Promise<Record<string, number>> {
    const results = await prisma.mockPerson.findMany({
      where: whereClause,
      select: { departments: true },
      take: 1000
    });

    const counts: Record<string, number> = {};
    results.forEach(person => {
      person.departments.forEach(dept => {
        counts[dept] = (counts[dept] || 0) + 1;
      });
    });

    return counts;
  }

  /**
   * Format counts for breadcrumb display
   */
  private static formatCounts(counts: Record<string, number>): any[] {
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([value, count]) => ({
        display_name: value,
        value,
        count
      }));
  }

  /**
   * Clear all cached breadcrumbs
   */
  static async clearCache(): Promise<void> {
    await prisma.breadcrumbCache.deleteMany();
    console.log('🗑️  Cleared breadcrumb cache');
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats(): Promise<any> {
    const total = await prisma.breadcrumbCache.count();
    const categories = await prisma.breadcrumbCache.groupBy({
      by: ['category'],
      _count: true
    });

    return {
      total,
      categories: categories.map(c => ({
        category: c.category,
        count: c._count
      }))
    };
  }
} 