// Apollo API compatible types

export interface PeopleSearchFilters {
  // Basic filters
  q?: string; // General search query
  person_titles?: string[]; // Job titles
  person_locations?: string[]; // Geographic locations
  person_seniorities?: string[]; // Seniority levels
  
  // Company filters
  organization_names?: string[]; // Company names
  organization_locations?: string[]; // Company locations
  organization_ids?: string[]; // Apollo organization IDs
  
  // Industry and size filters
  organization_industries?: string[]; // Industries
  organization_num_employees_ranges?: string[]; // Employee count ranges
  organization_founded_year_ranges?: string[]; // Founded year ranges
  
  // Technology filters
  technologies?: string[]; // Technologies used
  
  // Contact information filters
  person_email_status?: string[]; // Email verification status
  person_phone_status?: string[]; // Phone verification status
  
  // Department and function filters
  person_departments?: string[]; // Department names
  contact_email_status?: string[]; // Contact email status
  
  // Pagination
  page?: number;
  per_page?: number; // Max 100 per Apollo docs
}

export interface PeopleSearchResult {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  linkedin_url?: string;
  title?: string;
  email?: string;
  phone?: string;
  organization?: {
    id: string;
    name: string;
    website_url?: string;
    linkedin_url?: string;
    locations?: Array<{
      name: string;
      country: string;
      region?: string;
    }>;
  };
  seniority?: string;
  departments?: string[];
  subdepartments?: string[];
  functions?: string[];
  email_status?: string;
  phone_status?: string;
}

export interface PeopleSearchResponse {
  people: PeopleSearchResult[];
  pagination: {
    page: number;
    per_page: number;
    total_entries: number;
    total_pages: number;
  };
  breadcrumbs?: {
    signal_names: string[];
    person_titles: Array<{ display_name: string; value: string; count: number }>;
    person_locations: Array<{ display_name: string; value: string; count: number }>;
    person_seniorities: Array<{ display_name: string; value: string; count: number }>;
    organization_locations: Array<{ display_name: string; value: string; count: number }>;
    organization_industries: Array<{ display_name: string; value: string; count: number }>;
    organization_num_employees_ranges: Array<{ display_name: string; value: string; count: number }>;
    technologies: Array<{ display_name: string; value: string; count: number }>;
    person_departments: Array<{ display_name: string; value: string; count: number }>;
  };
}

export interface ApolloHealthCheck {
  isHealthy: boolean;
  status: 'healthy' | 'unhealthy' | 'unknown';
  message: string;
  responseTime?: number;
} 