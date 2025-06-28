import { PrismaClient } from '@prisma/client';
import { PeopleSearchFilters, PeopleSearchResponse, PeopleSearchResult } from '../types/apollo';
import { BreadcrumbCache } from './breadcrumbCache';

const prisma = new PrismaClient();

export class SearchService {
  /**
   * Search for people with Apollo API compatible filtering and pagination
   */
  static async searchPeople(filters: PeopleSearchFilters): Promise<PeopleSearchResponse> {
    const startTime = Date.now();
    
    // Apply latency simulation first
    await this.simulateLatency(filters.page || 1, filters.per_page || 25);

    // Build Prisma query with filters
    const whereClause = this.buildWhereClause(filters);
    
    // Pagination
    const page = filters.page || 1;
    const perPage = Math.min(filters.per_page || 25, 100); // Apollo max is 100
    const skip = (page - 1) * perPage;

    console.log(`🔍 Executing search query with filters:`, JSON.stringify(whereClause, null, 2));
    const queryStart = Date.now();

    // Execute search with total count
    const [people, totalCount] = await Promise.all([
      prisma.mockPerson.findMany({
        where: whereClause,
        include: {
          organization: {
            include: {
              locations: true
            }
          }
        },
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.mockPerson.count({ where: whereClause })
    ]);

    const queryTime = Date.now() - queryStart;
    console.log(`⚡ Main query completed in ${queryTime}ms (${people.length} results, ${totalCount} total)`);
    
    const breadcrumbStart = Date.now();

    // Transform to Apollo format
    const apolloResults: PeopleSearchResult[] = people.map(person => ({
      id: person.id,
      first_name: person.firstName,
      last_name: person.lastName,
      name: person.name,
      title: person.title,
      email: person.email || undefined,
      phone: person.phone || undefined,
      linkedin_url: person.linkedinUrl || undefined,
      seniority: person.seniority,
      departments: person.departments,
      email_status: person.emailStatus,
      phone_status: person.phoneStatus,
      organization: {
        id: person.organization.id,
        name: person.organization.name,
        website_url: person.organization.websiteUrl || undefined,
        linkedin_url: person.organization.linkedinUrl || undefined,
        locations: person.organization.locations.map(loc => ({
          name: loc.name,
          country: loc.country,
          region: loc.region || undefined
        }))
      }
    }));

    // Get breadcrumbs from cache (super fast!)
    let breadcrumbs = undefined;
    let breadcrumbTime = 0;
    
    if (process.env.DISABLE_BREADCRUMBS !== 'true') {
      breadcrumbs = await BreadcrumbCache.getCachedBreadcrumbs(whereClause);
      breadcrumbTime = Date.now() - breadcrumbStart;
      console.log(`📊 Breadcrumbs served from cache in ${breadcrumbTime}ms`);
    } else {
      console.log(`📊 Breadcrumbs disabled - skipped`);
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`🏁 Total search completed in ${totalTime}ms`);

    return {
      people: apolloResults,
      pagination: {
        page,
        per_page: perPage,
        total_entries: totalCount,
        total_pages: Math.ceil(totalCount / perPage)
      },
      breadcrumbs
    };
  }

  /**
   * Build Prisma where clause from Apollo filters
   */
  private static buildWhereClause(filters: PeopleSearchFilters): any {
    const where: any = {};

    // General search query
    if (filters.q) {
      where.OR = [
        { name: { contains: filters.q, mode: 'insensitive' } },
        { title: { contains: filters.q, mode: 'insensitive' } },
        { organization: { name: { contains: filters.q, mode: 'insensitive' } } }
      ];
    }

    // Person filters
    if (filters.person_titles?.length) {
      where.title = { in: filters.person_titles };
    }

    if (filters.person_seniorities?.length) {
      where.seniority = { in: filters.person_seniorities };
    }

    if (filters.person_email_status?.length) {
      where.emailStatus = { in: filters.person_email_status };
    }

    if (filters.person_phone_status?.length) {
      where.phoneStatus = { in: filters.person_phone_status };
    }

    if (filters.person_departments?.length) {
      where.departments = { hasSome: filters.person_departments };
    }

    // Organization filters
    if (filters.organization_names?.length) {
      where.organization = {
        ...where.organization,
        name: { in: filters.organization_names }
      };
    }

    if (filters.organization_industries?.length) {
      where.organization = {
        ...where.organization,
        industry: { in: filters.organization_industries }
      };
    }

    if (filters.organization_num_employees_ranges?.length) {
      where.organization = {
        ...where.organization,
        size: { in: filters.organization_num_employees_ranges }
      };
    }

    if (filters.organization_locations?.length) {
      where.organization = {
        ...where.organization,
        locations: {
          some: {
            name: { in: filters.organization_locations }
          }
        }
      };
    }

    return where;
  }

  /**
   * Generate breadcrumbs for search results
   */
  private static async generateBreadcrumbs(whereClause: any) {
    const breadcrumbStart = Date.now();
    
    // Get aggregate data for breadcrumbs with detailed timing
    const [
      titleCounts,
      seniorityCounts,
      industryCounts,
      sizeCounts,
      departmentCounts
    ] = await Promise.all([
      this.getFieldCountsWithTiming('title', whereClause),
      this.getFieldCountsWithTiming('seniority', whereClause),
      this.getOrganizationFieldCountsOptimized('industry', whereClause),
      this.getOrganizationFieldCountsOptimized('size', whereClause),
      this.getDepartmentCountsOptimized(whereClause)
    ]);

    const breadcrumbTotal = Date.now() - breadcrumbStart;
    console.log(`📊 All breadcrumb queries completed in ${breadcrumbTotal}ms`);

    return {
      signal_names: [],
      person_titles: this.formatBreadcrumbCounts(titleCounts),
      person_seniorities: this.formatBreadcrumbCounts(seniorityCounts),
      organization_industries: this.formatBreadcrumbCounts(industryCounts),
      organization_num_employees_ranges: this.formatBreadcrumbCounts(sizeCounts),
      person_departments: this.formatBreadcrumbCounts(departmentCounts),
      person_locations: [],
      organization_locations: [],
      technologies: []
    };
  }

  private static async getFieldCounts(field: string, whereClause: any) {
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

  private static async getFieldCountsWithTiming(field: string, whereClause: any) {
    const start = Date.now();
    const result = await this.getFieldCounts(field, whereClause);
    const time = Date.now() - start;
    console.log(`  📊 ${field} counts: ${time}ms`);
    return result;
  }

  private static async getOrganizationFieldCounts(field: string, whereClause: any) {
    const results = await prisma.mockPerson.findMany({
      where: whereClause,
      include: { organization: true },
      distinct: ['organizationId']
    });

    const counts: Record<string, number> = {};
    results.forEach(person => {
      const value = person.organization[field as keyof typeof person.organization] as string;
      counts[value] = (counts[value] || 0) + 1;
    });

    return counts;
  }

  private static async getOrganizationFieldCountsOptimized(field: string, whereClause: any) {
    const start = Date.now();
    
    // Much faster: use groupBy on organizationId, then get org details for top results only
    const orgGroups = await prisma.mockPerson.groupBy({
      by: ['organizationId'],
      where: whereClause,
      _count: true,
      orderBy: { _count: { organizationId: 'desc' } },
      take: 50  // Limit to top organizations for performance
    });

    // Get organization details only for the top results
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

    const time = Date.now() - start;
    console.log(`  📊 ${field} org counts: ${time}ms (${orgGroups.length} orgs)`);
    return counts;
  }

  private static async getDepartmentCounts(whereClause: any) {
    // Optimize: limit results for performance and use simpler query
    const results = await prisma.mockPerson.findMany({
      where: whereClause,
      select: { departments: true },
      take: 1000  // Limit for performance - sample for breadcrumbs
    });

    const counts: Record<string, number> = {};
    results.forEach(person => {
      person.departments.forEach(dept => {
        counts[dept] = (counts[dept] || 0) + 1;
      });
    });

    return counts;
  }

  private static async getDepartmentCountsOptimized(whereClause: any) {
    const start = Date.now();
    
    // Much smaller sample for better performance
    const results = await prisma.mockPerson.findMany({
      where: whereClause,
      select: { departments: true },
      take: 500  // Smaller sample for faster breadcrumbs
    });

    const counts: Record<string, number> = {};
    results.forEach(person => {
      person.departments.forEach(dept => {
        counts[dept] = (counts[dept] || 0) + 1;
      });
    });

    const time = Date.now() - start;
    console.log(`  📊 department counts: ${time}ms (${results.length} people sampled)`);
    return counts;
  }

  private static formatBreadcrumbCounts(counts: Record<string, number>) {
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
   * Simulate API latency based on environment configuration
   */
  private static async simulateLatency(page: number, recordCount: number): Promise<void> {
    // Check if latency simulation is disabled
    if (process.env.DISABLE_LATENCY_SIMULATION === 'true') {
      console.log(`🚀 Latency simulation disabled - responding immediately`);
      return;
    }

    // Check for fixed latency override
    const fixedLatency = parseInt(process.env.FIXED_LATENCY_MS || '0');
    if (fixedLatency > 0) {
      console.log(`⏱️  Using fixed latency: ${fixedLatency}ms`);
      await new Promise(resolve => setTimeout(resolve, fixedLatency));
      return;
    }

    // Get latency config from environment variables with defaults
    const baseLatencyMin = parseInt(process.env.BASE_LATENCY_MIN || '200');
    const baseLatencyMax = parseInt(process.env.BASE_LATENCY_MAX || '800');
    const perRecordLatency = parseInt(process.env.PER_RECORD_LATENCY || '2');
    const perPageLatency = parseInt(process.env.PER_PAGE_LATENCY || '10');

    // Calculate total latency
    const baseLatency = baseLatencyMin + Math.random() * (baseLatencyMax - baseLatencyMin);
    const recordLatency = recordCount * perRecordLatency;
    const pageLatency = page * perPageLatency;
    
    const totalLatency = Math.min(baseLatency + recordLatency + pageLatency, 2000); // Max 2 seconds
    
    console.log(`⏱️  Simulating Apollo API latency: ${Math.round(totalLatency)}ms (page ${page}, ${recordCount} records)`);
    
    await new Promise(resolve => setTimeout(resolve, totalLatency));
  }
} 