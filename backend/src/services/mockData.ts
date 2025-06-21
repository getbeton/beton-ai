import { PeopleSearchFilters, PeopleSearchResult, PeopleSearchResponse } from './apolloService';

/**
 * Mock data generator for Apollo People Search
 * Used when API key lacks permissions or for testing
 */
export class MockDataService {
  
  /**
   * Generate 100 diverse mock people for testing
   */
  static generateMockPeople(): PeopleSearchResult[] {
    const firstNames = [
      'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Chris', 'Lisa', 'Robert', 'Anna',
      'James', 'Maria', 'William', 'Jennifer', 'Richard', 'Patricia', 'Charles', 'Linda', 'Joseph', 'Elizabeth',
      'Thomas', 'Barbara', 'Daniel', 'Susan', 'Matthew', 'Jessica', 'Anthony', 'Karen', 'Mark', 'Nancy',
      'Donald', 'Betty', 'Steven', 'Helen', 'Paul', 'Sandra', 'Andrew', 'Donna', 'Joshua', 'Carol',
      'Kenneth', 'Ruth', 'Kevin', 'Sharon', 'Brian', 'Michelle', 'George', 'Laura', 'Edward', 'Sarah'
    ];

    const lastNames = [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
      'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
      'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
      'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
      'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'
    ];

    const titles = [
      'Software Engineer', 'Product Manager', 'Data Scientist', 'UX Designer', 'Marketing Manager',
      'Sales Director', 'Operations Manager', 'Financial Analyst', 'HR Manager', 'Business Analyst',
      'DevOps Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Mobile Developer',
      'UI/UX Designer', 'Graphic Designer', 'Content Manager', 'Social Media Manager', 'SEO Specialist',
      'Account Manager', 'Customer Success Manager', 'Technical Writer', 'QA Engineer', 'Security Analyst',
      'Project Manager', 'Scrum Master', 'Product Owner', 'VP of Engineering', 'CTO', 'CEO', 'CFO',
      'Marketing Director', 'Sales Manager', 'Regional Manager', 'Team Lead', 'Senior Consultant'
    ];

    const companies = [
      { name: 'TechCorp Inc', domain: 'techcorp.com', industry: 'Technology', size: '201-500', location: 'San Francisco' },
      { name: 'DataFlow Systems', domain: 'dataflow.io', industry: 'Technology', size: '51-200', location: 'New York' },
      { name: 'CloudNine Solutions', domain: 'cloudnine.com', industry: 'Technology', size: '11-50', location: 'Austin' },
      { name: 'FinanceFirst Bank', domain: 'financefirst.com', industry: 'Finance', size: '1000+', location: 'Chicago' },
      { name: 'HealthTech Labs', domain: 'healthtech.com', industry: 'Healthcare', size: '101-200', location: 'Boston' },
      { name: 'EcoGreen Energy', domain: 'ecogreen.com', industry: 'Energy', size: '501-1000', location: 'Seattle' },
      { name: 'RetailMax Corp', domain: 'retailmax.com', industry: 'Retail', size: '1000+', location: 'Los Angeles' },
      { name: 'EduLearn Platform', domain: 'edulearn.com', industry: 'Education', size: '51-200', location: 'Denver' },
      { name: 'FoodieDelight', domain: 'foodiedelight.com', industry: 'Food & Beverage', size: '11-50', location: 'Portland' },
      { name: 'TravelEase Inc', domain: 'travelease.com', industry: 'Travel', size: '201-500', location: 'Miami' }
    ];

    const seniorities = ['owner', 'founder', 'c_suite', 'partner', 'vp', 'head', 'director', 'manager', 'senior', 'entry', 'intern'];
    const departments = ['Engineering', 'Product', 'Marketing', 'Sales', 'Operations', 'Finance', 'HR', 'Design', 'Data', 'Security'];
    const emailStatuses = ['verified', 'guessed', 'unavailable'];
    const phoneStatuses = ['verified', 'guessed', 'unavailable'];

    const mockPeople: PeopleSearchResult[] = [];

    for (let i = 0; i < 100; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const title = titles[Math.floor(Math.random() * titles.length)];
      const company = companies[Math.floor(Math.random() * companies.length)];
      const seniority = seniorities[Math.floor(Math.random() * seniorities.length)];
      const department = departments[Math.floor(Math.random() * departments.length)];
      const emailStatus = emailStatuses[Math.floor(Math.random() * emailStatuses.length)];
      const phoneStatus = phoneStatuses[Math.floor(Math.random() * phoneStatuses.length)];

      const person: PeopleSearchResult = {
        id: `mock_${i + 1}`,
        first_name: firstName,
        last_name: lastName,
        name: `${firstName} ${lastName}`,
        title: title,
        email: emailStatus !== 'unavailable' ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.domain}` : undefined,
        phone: phoneStatus !== 'unavailable' ? `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}` : undefined,
        linkedin_url: `https://linkedin.com/in/${firstName.toLowerCase()}${lastName.toLowerCase()}`,
        seniority: seniority,
        departments: [department],
        email_status: emailStatus,
        phone_status: phoneStatus,
        organization: {
          id: `org_${Math.floor(i / 10) + 1}`,
          name: company.name,
          website_url: `https://${company.domain}`,
          linkedin_url: `https://linkedin.com/company/${company.name.toLowerCase().replace(/\s+/g, '-')}`,
          locations: [
            { name: company.location, country: 'US', region: company.location.includes('San Francisco') ? 'California' : 'Various' }
          ]
        }
      };

      mockPeople.push(person);
    }

    return mockPeople;
  }

  /**
   * Generate breadcrumbs from mock people data
   */
  static generateBreadcrumbs(people: PeopleSearchResult[]) {
    // Count occurrences for breadcrumbs
    const titleCounts: Record<string, number> = {};
    const locationCounts: Record<string, number> = {};
    const seniorityCounts: Record<string, number> = {};
    const orgLocationCounts: Record<string, number> = {};
    const industryCounts: Record<string, number> = {};
    const departmentCounts: Record<string, number> = {};

    people.forEach(person => {
      // Titles
      if (person.title) {
        titleCounts[person.title] = (titleCounts[person.title] || 0) + 1;
      }

      // Seniorities
      if (person.seniority) {
        seniorityCounts[person.seniority] = (seniorityCounts[person.seniority] || 0) + 1;
      }

      // Organization locations
      if (person.organization?.locations) {
        person.organization.locations.forEach(loc => {
          const locationKey = `${loc.name}, ${loc.region || loc.country}`;
          orgLocationCounts[locationKey] = (orgLocationCounts[locationKey] || 0) + 1;
        });
      }

      // Departments
      if (person.departments) {
        person.departments.forEach(dept => {
          departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
        });
      }
    });

    // Convert to breadcrumb format
    const createBreadcrumbs = (counts: Record<string, number>) => 
      Object.entries(counts)
        .sort(([,a], [,b]) => b - a) // Sort by count descending
        .slice(0, 10) // Top 10
        .map(([key, count]) => ({
          display_name: key,
          value: key.toLowerCase().replace(/\s+/g, '_'),
          count
        }));

    return {
      signal_names: ['title', 'location', 'company', 'seniority', 'department'],
      person_titles: createBreadcrumbs(titleCounts),
      person_locations: createBreadcrumbs(orgLocationCounts),
      person_seniorities: createBreadcrumbs(seniorityCounts),
      organization_locations: createBreadcrumbs(orgLocationCounts),
      organization_industries: [
        { display_name: 'Technology', value: 'technology', count: 40 },
        { display_name: 'Finance', value: 'finance', count: 15 },
        { display_name: 'Healthcare', value: 'healthcare', count: 12 },
        { display_name: 'Energy', value: 'energy', count: 10 },
        { display_name: 'Retail', value: 'retail', count: 8 },
        { display_name: 'Education', value: 'education', count: 7 },
        { display_name: 'Food & Beverage', value: 'food_beverage', count: 5 },
        { display_name: 'Travel', value: 'travel', count: 3 }
      ],
      organization_num_employees_ranges: [
        { display_name: '1000+', value: '1000+', count: 25 },
        { display_name: '501-1000', value: '501-1000', count: 20 },
        { display_name: '201-500', value: '201-500', count: 20 },
        { display_name: '101-200', value: '101-200', count: 15 },
        { display_name: '51-200', value: '51-200', count: 12 },
        { display_name: '11-50', value: '11-50', count: 8 }
      ],
      technologies: [
        { display_name: 'JavaScript', value: 'javascript', count: 25 },
        { display_name: 'Python', value: 'python', count: 22 },
        { display_name: 'React', value: 'react', count: 18 },
        { display_name: 'Node.js', value: 'nodejs', count: 15 },
        { display_name: 'AWS', value: 'aws', count: 12 },
        { display_name: 'Docker', value: 'docker', count: 10 }
      ],
      person_departments: createBreadcrumbs(departmentCounts)
    };
  }

  /**
   * Apply comprehensive filtering to mock people data
   */
  static applyFilters(people: PeopleSearchResult[], filters: PeopleSearchFilters): PeopleSearchResult[] {
    let filteredPeople = people;
    const searchQuery = filters.q || '';

    // Search query filter
    if (searchQuery) {
      filteredPeople = filteredPeople.filter((person: PeopleSearchResult) => 
        person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (person.title && person.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (person.organization?.name && person.organization.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (person.departments && person.departments.some(dept => dept.toLowerCase().includes(searchQuery.toLowerCase())))
      );
    }

    // Apply additional filters
    if (filters.person_titles && filters.person_titles.length > 0) {
      filteredPeople = filteredPeople.filter(person => 
        person.title && filters.person_titles!.some(title => 
          person.title!.toLowerCase().includes(title.toLowerCase())
        )
      );
    }

    if (filters.person_seniorities && filters.person_seniorities.length > 0) {
      filteredPeople = filteredPeople.filter(person => 
        person.seniority && filters.person_seniorities!.includes(person.seniority)
      );
    }

    if (filters.person_departments && filters.person_departments.length > 0) {
      filteredPeople = filteredPeople.filter(person => 
        person.departments && person.departments.some(dept => 
          filters.person_departments!.includes(dept)
        )
      );
    }

    return filteredPeople;
  }

  /**
   * Generate mock people search results with filtering and pagination
   */
  static getMockPeopleSearchResults(filters: PeopleSearchFilters): PeopleSearchResponse {
    // Generate 100 realistic mock people with diverse profiles
    const mockPeople = this.generateMockPeople();

    // Apply comprehensive filtering
    const filteredPeople = this.applyFilters(mockPeople, filters);

    // Pagination
    const page = filters.page || 1;
    const perPage = Math.min(filters.per_page || 25, 100);
    const startIndex = (page - 1) * perPage;
    const paginatedPeople = filteredPeople.slice(startIndex, startIndex + perPage);

    // Generate dynamic breadcrumbs from the full dataset
    const breadcrumbs = this.generateBreadcrumbs(mockPeople);

    return {
      people: paginatedPeople,
      pagination: {
        page: page,
        per_page: perPage,
        total_entries: filteredPeople.length,
        total_pages: Math.ceil(filteredPeople.length / perPage)
      },
      breadcrumbs: breadcrumbs
    };
  }
} 