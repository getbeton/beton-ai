import { LeadMagicHealthCheck, LeadMagicEmailFinderRequest, LeadMagicEmailFinderResponse } from '../types';

interface LeadMagicCreditsResponse {
  credits_remaining: number;
}

interface LeadMagicErrorResponse {
  message: string;
}

interface LeadMagicApiResponse {
  email: string;
  status: string;
  credits_consumed: number;
  message: string;
  first_name: string;
  last_name: string;
  domain: string;
  is_domain_catch_all: boolean;
  mx_record: string;
  mx_provider: string;
  mx_security_gateway: boolean;
  company_name: string;
  company_industry: string;
  company_size: string;
  company_founded: number;
  company_location: {
    name: string;
    locality: string;
    region: string;
    metro: string;
    country: string;
    continent: string;
    street_address: string;
    address_line_2: string | null;
    postal_code: string;
    geo: string;
  };
  company_linkedin_url: string;
  company_linkedin_id: string;
  company_facebook_url: string;
  company_twitter_url: string;
  company_type: string;
}

export class LeadMagicService {
  private static readonly API_BASE_URL = 'https://api.leadmagic.io';
  static readonly supportsValidation = true;

  private static async makeRequest<T>(endpoint: string, apiKey: string, method: 'GET' | 'POST' = 'GET', body?: any): Promise<T> {
    const response = await fetch(`${this.API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json() as LeadMagicErrorResponse;
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  static async validateApiKey(apiKey: string): Promise<LeadMagicHealthCheck> {
    try {
      const startTime = Date.now();
      const response = await this.makeRequest<LeadMagicCreditsResponse>('/credits', apiKey);
      const responseTime = Date.now() - startTime;

      return {
        isHealthy: true,
        status: 'healthy',
        message: 'API key is valid',
        creditsRemaining: response.credits_remaining,
        responseTime
      };
    } catch (error) {
      return {
        isHealthy: false,
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to validate API key',
      };
    }
  }

  static getSupportedActions(): string[] {
    return ['findEmail'];
  }

  static async executeAction(apiKey: string, action: string, payload: any): Promise<any> {
    switch (action) {
      case 'findEmail':
        return this.findEmail(apiKey, payload);
      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  }

  private static async findEmail(apiKey: string, request: LeadMagicEmailFinderRequest): Promise<LeadMagicEmailFinderResponse> {
    const requestBody = {
      first_name: request.firstName,
      last_name: request.lastName,
      domain: request.domain,
      company_name: request.companyName,
    };

    const response = await this.makeRequest<LeadMagicApiResponse>('/email-finder', apiKey, 'POST', requestBody);

    return {
      email: response.email,
      status: response.status,
      creditsConsumed: response.credits_consumed,
      message: response.message,
      firstName: response.first_name,
      lastName: response.last_name,
      domain: response.domain,
      isDomainCatchAll: response.is_domain_catch_all,
      mxRecord: response.mx_record,
      mxProvider: response.mx_provider,
      mxSecurityGateway: response.mx_security_gateway,
      companyName: response.company_name,
      companyIndustry: response.company_industry,
      companySize: response.company_size,
      companyFounded: response.company_founded,
      companyLocation: {
        name: response.company_location.name,
        locality: response.company_location.locality,
        region: response.company_location.region,
        metro: response.company_location.metro,
        country: response.company_location.country,
        continent: response.company_location.continent,
        streetAddress: response.company_location.street_address,
        addressLine2: response.company_location.address_line_2 || undefined,
        postalCode: response.company_location.postal_code,
        geo: response.company_location.geo,
      },
      companyLinkedinUrl: response.company_linkedin_url,
      companyLinkedinId: response.company_linkedin_id,
      companyFacebookUrl: response.company_facebook_url,
      companyTwitterUrl: response.company_twitter_url,
      companyType: response.company_type,
    };
  }
} 