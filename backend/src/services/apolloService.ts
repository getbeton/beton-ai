import { ApolloRouter } from './apolloRouter';

export interface ApolloHealthCheck {
  isHealthy: boolean;
  status: 'healthy' | 'unhealthy' | 'unknown';
  message: string;
  responseTime?: number;
}

export interface ServiceValidation {
  supportsValidation: boolean;
  validateApiKey(apiKey: string): Promise<ApolloHealthCheck>;
}

// People Search interfaces based on Apollo API documentation
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

/**
 * Internal Apollo service - handles Apollo integrations within the monolith
 */
export class ApolloService {
  
  // Indicates this service supports API key validation
  static readonly supportsValidation = true;

  /**
   * Check if an Apollo API key is healthy by calling Apollo's health endpoint (with configurable routing)
   * Based on: https://docs.apollo.io/docs/test-api-key
   */
  static async checkHealth(apiKey: string): Promise<ApolloHealthCheck> {
    const startTime = Date.now();
    
    try {
      // Basic validation: check if key exists and has reasonable length
      if (!apiKey || apiKey.trim().length < 10) {
        return {
          isHealthy: false,
          status: 'unhealthy',
          message: 'Invalid API key format - key must be at least 10 characters',
          responseTime: Date.now() - startTime
        };
      }

      // Route the request through the Apollo router
      const data = await ApolloRouter.routeRequest('/v1/auth/health', apiKey, {});
      const responseTime = Date.now() - startTime;
      
      // According to Apollo docs, both values should be true for a healthy key
      const isKeyValid = data && 
                        typeof data === 'object' && 
                        Object.values(data).length > 0 && 
                        Object.values(data).every(value => value === true);

      if (isKeyValid) {
        return {
          isHealthy: true,
          status: 'healthy',
          message: 'Apollo API key is valid and healthy',
          responseTime
        };
      } else {
        return {
          isHealthy: false,
          status: 'unhealthy',
          message: 'Apollo API returned unexpected response format',
          responseTime
        };
      }

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      // Handle different types of errors
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        return {
          isHealthy: false,
          status: 'unhealthy',
          message: 'Apollo API request timed out - check your connection',
          responseTime
        };
      }

      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return {
          isHealthy: false,
          status: 'unhealthy',
          message: 'Unable to connect to Apollo API - check your internet connection',
          responseTime
        };
      }

      return {
        isHealthy: false,
        status: 'unhealthy',
        message: error.message || 'Unknown error occurred during validation',
        responseTime
      };
    }
  }

  /**
   * Validate API key (alias for checkHealth for consistency)
   */
  static async validateApiKey(apiKey: string): Promise<ApolloHealthCheck> {
    return this.checkHealth(apiKey);
  }

  /**
   * Search for people using Apollo's People Search API (with configurable routing)
   * Documentation: https://docs.apollo.io/reference/people-search
   */
  static async searchPeople(apiKey: string, filters: PeopleSearchFilters): Promise<PeopleSearchResponse> {
    try {
      // Validate API key first (only for real API calls)
      if (!apiKey || apiKey.trim().length < 10) {
        console.warn('Invalid API key format, routing to mock service');
      }

      // Prepare request body
      const requestBody: any = {};
      
      // Add filters to request body if they exist
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof PeopleSearchFilters];
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value) && value.length > 0) {
            requestBody[key] = value;
          } else if (!Array.isArray(value)) {
            requestBody[key] = value;
          }
        }
      });

      // Set pagination defaults
      requestBody.page = filters.page || 1;
      requestBody.per_page = Math.min(filters.per_page || 25, 100); // Apollo max is 100

      console.log('Apollo People Search request:', JSON.stringify(requestBody, null, 2));

      // Route the request through the Apollo router
      return await ApolloRouter.routeRequest('/api/v1/mixed_people/search', apiKey, requestBody) as PeopleSearchResponse;

    } catch (error: any) {
      console.error('Apollo People Search error:', error);
      throw new Error(error.message || 'Failed to search people');
    }
  }

  /**
   * Execute actions using Apollo integration
   * This is where actual Apollo operations would be implemented
   */
  static async executeAction(apiKey: string, action: string, payload: any) {
    try {
      // Handle specific actions
      switch (action) {
        case 'people_search':
          return await this.searchPeople(apiKey, payload);
        
        default:
          // Mock implementation for other actions
          console.log(`Executing Apollo action: ${action} with key: ${apiKey.substring(0, 8)}...`);
          
          // Simulate processing
          await new Promise(resolve => setTimeout(resolve, 50));
          
          return {
            success: true,
            action,
            result: `Apollo action '${action}' executed successfully`,
            data: payload
          };
      }
      
    } catch (error: any) {
      return {
        success: false,
        action,
        error: error.message
      };
    }
  }
  


  /**
   * Get supported actions for Apollo service
   */
  static getSupportedActions(): string[] {
    return [
      'people_search',
      'graphql_query',
      'schema_introspection', 
      'performance_metrics',
      'error_tracking'
    ];
  }
} 