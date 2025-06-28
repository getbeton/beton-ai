import { PrismaClient } from '@prisma/client';
import { PeopleSearchFilters, PeopleSearchResponse, PeopleSearchResult } from '../types/apollo';

const prisma = new PrismaClient();

export class SearchService {
  /**
   * Search for people with Apollo API compatible filtering and pagination
   */
  static async searchPeople(filters: PeopleSearchFilters): Promise<PeopleSearchResponse> {
    // Apply latency simulation first
    await this.simulateLatency(filters.page || 1, filters.per_page || 25);

    // Build Prisma query with filters
    const whereClause = this.buildWhereClause(filters);
    
    // Pagination
    const page = filters.page || 1;
    const perPage = Math.min(filters.per_page || 25, 100); // Apollo max is 100
    const skip = (page - 1) * perPage;

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

    // Generate breadcrumbs
    const breadcrumbs = await this.generateBreadcrumbs(whereClause);

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
    // Get aggregate data for breadcrumbs
    const [
      titleCounts,
      seniorityCounts,
      industryCounts,
      sizeCounts,
      departmentCounts
    ] = await Promise.all([
      this.getFieldCounts('title', whereClause),
      this.getFieldCounts('seniority', whereClause),
      this.getOrganizationFieldCounts('industry', whereClause),
      this.getOrganizationFieldCounts('size', whereClause),
      this.getDepartmentCounts(whereClause)
    ]);

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

  private static async getDepartmentCounts(whereClause: any) {
    const results = await prisma.mockPerson.findMany({
      where: whereClause,
      select: { departments: true }
    });

    const counts: Record<string, number> = {};
    results.forEach(person => {
      person.departments.forEach(dept => {
        counts[dept] = (counts[dept] || 0) + 1;
      });
    });

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
   * Simulate API latency based on configuration
   */
  private static async simulateLatency(page: number, recordCount: number): Promise<void> {
    // Get latency config from database
    const config = await prisma.serviceConfig.findMany({
      where: {
        key: { in: ['base_latency_min', 'base_latency_max', 'per_record_latency', 'per_page_latency'] }
      }
    });

    const configMap = config.reduce((acc, item) => {
      acc[item.key] = parseInt(item.value);
      return acc;
    }, {} as Record<string, number>);

    // Default values if not configured
    const baseLatencyMin = configMap.base_latency_min || 200;
    const baseLatencyMax = configMap.base_latency_max || 800;
    const perRecordLatency = configMap.per_record_latency || 2;
    const perPageLatency = configMap.per_page_latency || 10;

    // Calculate total latency
    const baseLatency = baseLatencyMin + Math.random() * (baseLatencyMax - baseLatencyMin);
    const recordLatency = recordCount * perRecordLatency;
    const pageLatency = page * perPageLatency;
    
    const totalLatency = Math.min(baseLatency + recordLatency + pageLatency, 2000); // Max 2 seconds
    
    console.log(`⏱️  Simulating Apollo API latency: ${Math.round(totalLatency)}ms (page ${page}, ${recordCount} records)`);
    
    await new Promise(resolve => setTimeout(resolve, totalLatency));
  }
} 