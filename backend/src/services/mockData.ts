import { PeopleSearchFilters, PeopleSearchResult, PeopleSearchResponse } from './apolloService';

/**
 * Mock data generator for Apollo People Search
 * Used when API key lacks permissions or for testing
 */
export class MockDataService {
  // Cache for generated mock people to ensure consistency across requests
  private static mockPeopleCache: PeopleSearchResult[] | null = null;
  
  /**
   * Generate 10,000 diverse mock people for testing
   */
  static generateMockPeople(): PeopleSearchResult[] {
    // Return cached data if available to ensure consistency
    if (this.mockPeopleCache) {
      return this.mockPeopleCache;
    }
    const firstNames = [
      'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Chris', 'Lisa', 'Robert', 'Anna',
      'James', 'Maria', 'William', 'Jennifer', 'Richard', 'Patricia', 'Charles', 'Linda', 'Joseph', 'Elizabeth',
      'Thomas', 'Barbara', 'Daniel', 'Susan', 'Matthew', 'Jessica', 'Anthony', 'Karen', 'Mark', 'Nancy',
      'Donald', 'Betty', 'Steven', 'Helen', 'Paul', 'Sandra', 'Andrew', 'Donna', 'Joshua', 'Carol',
      'Kenneth', 'Ruth', 'Kevin', 'Sharon', 'Brian', 'Michelle', 'George', 'Laura', 'Edward', 'Sarah',
      'Christopher', 'Amy', 'Ryan', 'Kimberly', 'Nicholas', 'Deborah', 'Jonathan', 'Rachel', 'Justin', 'Carolyn',
      'Frank', 'Janet', 'Gregory', 'Catherine', 'Raymond', 'Frances', 'Alexander', 'Maria', 'Patrick', 'Heather',
      'Jack', 'Diane', 'Dennis', 'Julie', 'Jerry', 'Joyce', 'Tyler', 'Virginia', 'Aaron', 'Victoria',
      'Jose', 'Kelly', 'Henry', 'Christina', 'Adam', 'Joan', 'Douglas', 'Evelyn', 'Harold', 'Lauren',
      'Zachary', 'Judith', 'Nathan', 'Megan', 'Peter', 'Cheryl', 'Kyle', 'Andrea', 'Noah', 'Hannah',
      'Jeremy', 'Jacqueline', 'Samuel', 'Martha', 'Mason', 'Gloria', 'Carl', 'Teresa', 'Sean', 'Sara',
      'Wayne', 'Janice', 'Arthur', 'Marie', 'Lawrence', 'Julia', 'Roger', 'Kathryn', 'Austin', 'Frances',
      'Louis', 'Jean', 'Philip', 'Alice', 'Bobby', 'Judy', 'Ralph', 'Amber', 'Roy', 'Denise',
      'Eugene', 'Danielle', 'Louis', 'Abigail', 'Philip', 'Julie', 'Johnny', 'Samantha', 'Mason', 'Destiny'
    ];

    const lastNames = [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
      'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
      'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
      'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
      'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
      'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
      'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper',
      'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
      'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes',
      'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross', 'Foster', 'Jimenez',
      'Powell', 'Jenkins', 'Perry', 'Russell', 'Sullivan', 'Bell', 'Coleman', 'Butler', 'Henderson', 'Barnes',
      'Gonzales', 'Fisher', 'Vasquez', 'Simmons', 'Romero', 'Jordan', 'Patterson', 'Alexander', 'Hamilton', 'Graham',
      'Reynolds', 'Griffin', 'Wallace', 'Moreno', 'West', 'Cole', 'Hayes', 'Bryant', 'Herrera', 'Gibson',
      'Ellis', 'Tran', 'Medina', 'Aguilar', 'Stevens', 'Murray', 'Ford', 'Castro', 'Marshall', 'Owens'
    ];

    const titles = [
      'Software Engineer', 'Product Manager', 'Data Scientist', 'UX Designer', 'Marketing Manager',
      'Sales Director', 'Operations Manager', 'Financial Analyst', 'HR Manager', 'Business Analyst',
      'DevOps Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Mobile Developer',
      'UI/UX Designer', 'Graphic Designer', 'Content Manager', 'Social Media Manager', 'SEO Specialist',
      'Account Manager', 'Customer Success Manager', 'Technical Writer', 'QA Engineer', 'Security Analyst',
      'Project Manager', 'Scrum Master', 'Product Owner', 'VP of Engineering', 'CTO', 'CEO', 'CFO',
      'Marketing Director', 'Sales Manager', 'Regional Manager', 'Team Lead', 'Senior Consultant',
      'Software Architect', 'Cloud Engineer', 'Machine Learning Engineer', 'Platform Engineer', 'Site Reliability Engineer',
      'Database Administrator', 'Network Engineer', 'Systems Administrator', 'Cybersecurity Specialist', 'Data Engineer',
      'Business Intelligence Analyst', 'Digital Marketing Specialist', 'Growth Hacker', 'Performance Marketer', 'Content Strategist',
      'Sales Development Representative', 'Account Executive', 'Customer Support Specialist', 'Success Manager', 'Implementation Specialist',
      'Product Designer', 'Visual Designer', 'Motion Designer', 'Brand Designer', 'Creative Director',
      'Engineering Manager', 'Design Manager', 'Marketing Manager', 'Sales Manager', 'Operations Manager',
      'Senior Software Engineer', 'Principal Engineer', 'Staff Engineer', 'Lead Developer', 'Senior Designer',
      'Director of Engineering', 'VP of Product', 'VP of Marketing', 'VP of Sales', 'Chief Product Officer',
      'Consultant', 'Senior Consultant', 'Principal Consultant', 'Strategy Consultant', 'Technology Consultant',
      'Research Scientist', 'Research Engineer', 'Applied Scientist', 'Algorithm Engineer', 'Computer Vision Engineer',
      'Solutions Architect', 'Technical Account Manager', 'Pre-Sales Engineer', 'Integration Engineer', 'API Developer',
      'Revenue Operations Manager', 'Sales Operations Analyst', 'Marketing Operations Manager', 'People Operations Manager',
      'Talent Acquisition Specialist', 'Recruiter', 'Technical Recruiter', 'Sourcing Specialist', 'Talent Partner'
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
      { name: 'TravelEase Inc', domain: 'travelease.com', industry: 'Travel', size: '201-500', location: 'Miami' },
      { name: 'GlobalTech Solutions', domain: 'globaltech.com', industry: 'Technology', size: '1000+', location: 'San Francisco' },
      { name: 'InnovateLabs', domain: 'innovatelabs.io', industry: 'Technology', size: '101-200', location: 'Palo Alto' },
      { name: 'CyberShield Security', domain: 'cybershield.com', industry: 'Cybersecurity', size: '51-200', location: 'Washington DC' },
      { name: 'QuantumData Corp', domain: 'quantumdata.com', industry: 'Technology', size: '201-500', location: 'Cambridge' },
      { name: 'NextGen Analytics', domain: 'nextgenanalytics.com', industry: 'Technology', size: '11-50', location: 'San Diego' },
      { name: 'MegaBank Holdings', domain: 'megabank.com', industry: 'Finance', size: '1000+', location: 'New York' },
      { name: 'StartupCapital Fund', domain: 'startupcapital.com', industry: 'Finance', size: '51-200', location: 'San Francisco' },
      { name: 'WealthTech Advisors', domain: 'wealthtech.com', industry: 'Finance', size: '101-200', location: 'Charlotte' },
      { name: 'MedCore Systems', domain: 'medcore.com', industry: 'Healthcare', size: '501-1000', location: 'Atlanta' },
      { name: 'BioInnovate Labs', domain: 'bioinnovate.com', industry: 'Healthcare', size: '201-500', location: 'San Diego' },
      { name: 'HealthFirst Network', domain: 'healthfirst.com', industry: 'Healthcare', size: '1000+', location: 'Houston' },
      { name: 'GreenPower Solutions', domain: 'greenpower.com', industry: 'Energy', size: '201-500', location: 'Austin' },
      { name: 'SolarTech Systems', domain: 'solartech.com', industry: 'Energy', size: '101-200', location: 'Phoenix' },
      { name: 'WindForce Energy', domain: 'windforce.com', industry: 'Energy', size: '51-200', location: 'Portland' },
      { name: 'EcommerceGiant', domain: 'ecommercegiant.com', industry: 'Retail', size: '1000+', location: 'Seattle' },
      { name: 'FashionForward', domain: 'fashionforward.com', industry: 'Retail', size: '201-500', location: 'Los Angeles' },
      { name: 'SportingGoods Plus', domain: 'sportinggoods.com', industry: 'Retail', size: '501-1000', location: 'Chicago' },
      { name: 'EdTech Innovations', domain: 'edtechinnovations.com', industry: 'Education', size: '101-200', location: 'Boston' },
      { name: 'UniversityTech', domain: 'universitytech.edu', industry: 'Education', size: '1000+', location: 'Stanford' },
      { name: 'LearningSoft', domain: 'learningsoft.com', industry: 'Education', size: '51-200', location: 'Philadelphia' },
      { name: 'CloudScale Infrastructure', domain: 'cloudscale.com', industry: 'Technology', size: '501-1000', location: 'Virginia' },
      { name: 'AI Dynamics', domain: 'aidynamics.com', industry: 'Technology', size: '11-50', location: 'Mountain View' },
      { name: 'RoboticsFlow', domain: 'roboticsflow.com', industry: 'Technology', size: '101-200', location: 'Detroit' },
      { name: 'DataMining Corp', domain: 'datamining.com', industry: 'Technology', size: '201-500', location: 'San Jose' },
      { name: 'BlockchainTech', domain: 'blockchaintech.com', industry: 'Technology', size: '51-200', location: 'Miami' },
      { name: 'GameDev Studios', domain: 'gamedev.com', industry: 'Technology', size: '101-200', location: 'Los Angeles' },
      { name: 'VirtualReality Labs', domain: 'vrlab.com', industry: 'Technology', size: '11-50', location: 'San Francisco' },
      { name: 'MobileTech Solutions', domain: 'mobiletech.com', industry: 'Technology', size: '201-500', location: 'Austin' },
      { name: 'WebDev Agency', domain: 'webdev.com', industry: 'Technology', size: '51-200', location: 'Portland' },
      { name: 'CreativePixel Studio', domain: 'creativepixel.com', industry: 'Technology', size: '11-50', location: 'Brooklyn' },
      { name: 'MarketingMaster', domain: 'marketingmaster.com', industry: 'Marketing', size: '101-200', location: 'Chicago' }
    ];

    const seniorities = ['owner', 'founder', 'c_suite', 'partner', 'vp', 'head', 'director', 'manager', 'senior', 'entry', 'intern'];
    const departments = ['Engineering', 'Product', 'Marketing', 'Sales', 'Operations', 'Finance', 'HR', 'Design', 'Data', 'Security'];
    const emailStatuses = ['verified', 'guessed', 'unavailable'];
    const phoneStatuses = ['verified', 'guessed', 'unavailable'];

    console.log('🔧 Generating 10,000 mock people for realistic bulk download testing...');
    const mockPeople: PeopleSearchResult[] = [];

    for (let i = 0; i < 10000; i++) {
      // Progress logging for large dataset generation
      if (i % 1000 === 0) {
        console.log(`  📊 Generated ${i}/10,000 mock people...`);
      }
      
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

    console.log(`✅ Generated ${mockPeople.length} mock people and cached for consistency`);
    
    // Cache the generated data for consistency across requests
    this.mockPeopleCache = mockPeople;
    
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
        { display_name: 'Technology', value: 'technology', count: 4200 },
        { display_name: 'Finance', value: 'finance', count: 1800 },
        { display_name: 'Healthcare', value: 'healthcare', count: 1500 },
        { display_name: 'Energy', value: 'energy', count: 1200 },
        { display_name: 'Retail', value: 'retail', count: 900 },
        { display_name: 'Education', value: 'education', count: 700 },
        { display_name: 'Food & Beverage', value: 'food_beverage', count: 500 },
        { display_name: 'Travel', value: 'travel', count: 200 }
      ],
      organization_num_employees_ranges: [
        { display_name: '1000+', value: '1000+', count: 2500 },
        { display_name: '501-1000', value: '501-1000', count: 2000 },
        { display_name: '201-500', value: '201-500', count: 2000 },
        { display_name: '101-200', value: '101-200', count: 1500 },
        { display_name: '51-200', value: '51-200', count: 1200 },
        { display_name: '11-50', value: '11-50', count: 800 }
      ],
      technologies: [
        { display_name: 'JavaScript', value: 'javascript', count: 2800 },
        { display_name: 'Python', value: 'python', count: 2400 },
        { display_name: 'React', value: 'react', count: 2000 },
        { display_name: 'Node.js', value: 'nodejs', count: 1600 },
        { display_name: 'AWS', value: 'aws', count: 1400 },
        { display_name: 'Docker', value: 'docker', count: 1200 }
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
   * Add realistic latency simulation to mimic Apollo API response times
   */
  static async simulateApiLatency(pageNumber: number = 1, recordCount: number = 25): Promise<void> {
    // Base latency: 200-800ms (realistic API response time)
    const baseLatency = 1 + Math.random() * 1;
    
    // Additional latency for larger pages (more data processing)
    const pageLatency = recordCount * 2; // 2ms per record
    
    // Slight additional delay for higher page numbers (server processing)
    const paginationLatency = pageNumber * 10;
    
    const totalLatency = Math.min(baseLatency + pageLatency + paginationLatency, 2000); // Max 2 seconds
    
    console.log(`  ⏱️  Simulating Apollo API latency: ${Math.round(totalLatency)}ms (page ${pageNumber}, ${recordCount} records)`);
    
    await new Promise(resolve => setTimeout(resolve, totalLatency));
  }

  /**
   * Generate mock people search results with filtering, pagination, and realistic latency
   */
  static async getMockPeopleSearchResults(filters: PeopleSearchFilters): Promise<PeopleSearchResponse> {
    // Generate 10,000 realistic mock people with diverse profiles
    const mockPeople = this.generateMockPeople();

    // Apply comprehensive filtering
    const filteredPeople = this.applyFilters(mockPeople, filters);

    // Pagination
    const page = filters.page || 1;
    const perPage = Math.min(filters.per_page || 25, 100);
    const startIndex = (page - 1) * perPage;
    const paginatedPeople = filteredPeople.slice(startIndex, startIndex + perPage);

    // Simulate realistic API latency
    await this.simulateApiLatency(page, paginatedPeople.length);

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