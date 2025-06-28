import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SeedService {
  private static readonly ENTITY_COUNT = 100000;
  private static readonly BATCH_SIZE = 1000;

  // Sample data arrays
  private static readonly firstNames = [
    'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Chris', 'Lisa', 'Robert', 'Anna',
    'James', 'Maria', 'William', 'Jennifer', 'Richard', 'Patricia', 'Charles', 'Linda', 'Joseph', 'Elizabeth',
    'Thomas', 'Barbara', 'Daniel', 'Susan', 'Matthew', 'Jessica', 'Anthony', 'Karen', 'Mark', 'Nancy',
    'Donald', 'Betty', 'Steven', 'Helen', 'Paul', 'Sandra', 'Andrew', 'Donna', 'Joshua', 'Carol',
    'Kenneth', 'Ruth', 'Kevin', 'Sharon', 'Brian', 'Michelle', 'George', 'Laura', 'Edward', 'Sarah',
    'Christopher', 'Amy', 'Ryan', 'Kimberly', 'Nicholas', 'Deborah', 'Jonathan', 'Rachel', 'Justin', 'Carolyn',
    'Frank', 'Janet', 'Gregory', 'Catherine', 'Raymond', 'Frances', 'Alexander', 'Maria', 'Patrick', 'Heather',
    'Jack', 'Diane', 'Dennis', 'Julie', 'Jerry', 'Joyce', 'Tyler', 'Virginia', 'Aaron', 'Victoria',
    'Jose', 'Kelly', 'Henry', 'Christina', 'Adam', 'Joan', 'Douglas', 'Evelyn', 'Harold', 'Lauren',
    'Zachary', 'Judith', 'Nathan', 'Megan', 'Peter', 'Cheryl', 'Kyle', 'Andrea', 'Noah', 'Hannah'
  ];

  private static readonly lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
    'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
    'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
    'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
    'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes'
  ];

  private static readonly titles = [
    'Software Engineer', 'Product Manager', 'Data Scientist', 'UX Designer', 'Marketing Manager',
    'Sales Director', 'Operations Manager', 'Financial Analyst', 'HR Manager', 'Business Analyst',
    'DevOps Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Mobile Developer',
    'UI/UX Designer', 'Graphic Designer', 'Content Manager', 'Social Media Manager', 'SEO Specialist',
    'Account Manager', 'Customer Success Manager', 'Technical Writer', 'QA Engineer', 'Security Analyst',
    'Project Manager', 'Scrum Master', 'Product Owner', 'VP of Engineering', 'CTO', 'CEO', 'CFO'
  ];

  private static readonly companies = [
    { name: 'TechCorp Inc', domain: 'techcorp.com', industry: 'Technology', size: '201-500', location: 'San Francisco' },
    { name: 'DataFlow Systems', domain: 'dataflow.io', industry: 'Technology', size: '51-200', location: 'New York' },
    { name: 'CloudNine Solutions', domain: 'cloudnine.com', industry: 'Technology', size: '11-50', location: 'Austin' },
    { name: 'FinanceFirst Bank', domain: 'financefirst.com', industry: 'Finance', size: '1000+', location: 'Chicago' },
    { name: 'HealthTech Labs', domain: 'healthtech.com', industry: 'Healthcare', size: '101-200', location: 'Boston' },
    { name: 'EcoGreen Energy', domain: 'ecogreen.com', industry: 'Energy', size: '501-1000', location: 'Seattle' },
    { name: 'RetailMax Corp', domain: 'retailmax.com', industry: 'Retail', size: '1000+', location: 'Los Angeles' },
    { name: 'EduLearn Platform', domain: 'edulearn.com', industry: 'Education', size: '51-200', location: 'Denver' }
  ];

  private static readonly seniorities = ['owner', 'founder', 'c_suite', 'partner', 'vp', 'head', 'director', 'manager', 'senior', 'entry', 'intern'];
  private static readonly departments = ['Engineering', 'Product', 'Marketing', 'Sales', 'Operations', 'Finance', 'HR', 'Design', 'Data', 'Security'];
  private static readonly emailStatuses = ['verified', 'guessed', 'unavailable'];
  private static readonly phoneStatuses = ['verified', 'guessed', 'unavailable'];

  static async seedDatabase(): Promise<void> {
    console.log(`🌱 Starting database seed with ${this.ENTITY_COUNT} entities...`);
    
    // Check if already seeded
    const existingCount = await prisma.mockPerson.count();
    if (existingCount >= this.ENTITY_COUNT) {
      console.log(`✅ Database already seeded with ${existingCount} entities`);
      return;
    }

    // Clear existing data if partial seed
    if (existingCount > 0) {
      console.log('🗑️  Clearing existing data for fresh seed...');
      await prisma.mockPerson.deleteMany();
      await prisma.mockLocation.deleteMany();
      await prisma.mockOrganization.deleteMany();
    }

    // First, create organizations
    console.log('📦 Creating organizations...');
    const organizations = await this.createOrganizations();
    
    // Then create people in batches
    console.log('👥 Creating people...');
    await this.createPeople(organizations);
    
    console.log(`✅ Database seeding complete: ${this.ENTITY_COUNT} entities created`);
  }

  private static async createOrganizations() {
    const organizationsToCreate = [];
    const organizationsCount = Math.max(this.companies.length, Math.ceil(this.ENTITY_COUNT / 50)); // ~50 people per org

    for (let i = 0; i < organizationsCount; i++) {
      const company = this.companies[i % this.companies.length];
      const orgVariation = i < this.companies.length ? '' : ` ${Math.floor(i / this.companies.length) + 1}`;
      
      organizationsToCreate.push({
        name: `${company.name}${orgVariation}`,
        domain: i < this.companies.length ? company.domain : `${company.domain.split('.')[0]}${i}.com`,
        websiteUrl: `https://${company.domain}`,
        linkedinUrl: `https://linkedin.com/company/${company.name.toLowerCase().replace(/\s+/g, '-')}`,
        industry: company.industry,
        size: company.size,
        foundedYear: 1990 + Math.floor(Math.random() * 34)
      });
    }

    const organizations = await prisma.mockOrganization.createMany({
      data: organizationsToCreate
    });

    // Get created organizations
    const createdOrgs = await prisma.mockOrganization.findMany();
    
    // Create locations for organizations
    const locationsToCreate = createdOrgs.map(org => ({
      name: this.companies[Math.floor(Math.random() * this.companies.length)].location,
      country: 'US',
      region: 'Various',
      organizationId: org.id
    }));

    await prisma.mockLocation.createMany({
      data: locationsToCreate
    });

    console.log(`📦 Created ${createdOrgs.length} organizations with locations`);
    return createdOrgs;
  }

  private static async createPeople(organizations: any[]) {
    const batches = Math.ceil(this.ENTITY_COUNT / this.BATCH_SIZE);
    
    for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
      const batchStart = batchIndex * this.BATCH_SIZE;
      const batchEnd = Math.min(batchStart + this.BATCH_SIZE, this.ENTITY_COUNT);
      
      const peopleToCreate = [];
      
      for (let i = batchStart; i < batchEnd; i++) {
        const firstName = this.randomChoice(this.firstNames);
        const lastName = this.randomChoice(this.lastNames);
        const title = this.randomChoice(this.titles);
        const seniority = this.randomChoice(this.seniorities);
        const department = this.randomChoice(this.departments);
        const emailStatus = this.randomChoice(this.emailStatuses);
        const phoneStatus = this.randomChoice(this.phoneStatuses);
        const organization = this.randomChoice(organizations);
        
        peopleToCreate.push({
          firstName,
          lastName,
          name: `${firstName} ${lastName}`,
          title,
          email: emailStatus !== 'unavailable' ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${organization.domain}` : null,
          phone: phoneStatus !== 'unavailable' ? `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}` : null,
          linkedinUrl: `https://linkedin.com/in/${firstName.toLowerCase()}${lastName.toLowerCase()}`,
          seniority,
          departments: [department],
          emailStatus,
          phoneStatus,
          organizationId: organization.id
        });
      }
      
      await prisma.mockPerson.createMany({
        data: peopleToCreate
      });
      
      if (batchIndex % 10 === 0) {
        console.log(`  📊 Created ${batchEnd}/${this.ENTITY_COUNT} people (${Math.round(batchEnd/this.ENTITY_COUNT*100)}%)`);
      }
    }
  }

  private static randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
} 