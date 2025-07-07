import { ServiceHealthCheck } from './serviceFactory';

interface FindymailCreditsResponse {
  credits: number;
  verifier_credits: number;
}

export interface FindymailHealthCheck {
  isHealthy: boolean;
  status: 'healthy' | 'unhealthy' | 'unknown';
  message: string;
  credits?: number;
  verifier_credits?: number;
  responseTime?: number;
}

export interface FindymailContact {
  id: number;
  name: string;
  email: string;
  domain: string;
  company: string;
  linkedin_url: string | null;
  job_title: string | null;
  company_city: string;
  company_region: string;
  company_country: string;
  city: string | null;
  region: string | null;
  country: string | null;
  phone_number: string | null;
}

export interface FindymailSearchResponse {
  success: boolean;
  data: {
    contact: FindymailContact;
  };
}

interface FindymailApiResponse {
  contact: {
    id: number;
    name: string;
    email: string;
    domain: string;
    company: string;
    linkedin_url?: string;
    job_title?: string;
    company_city?: string;
    company_region?: string;
    company_country?: string;
    city?: string;
    region?: string;
    country?: string;
    phone_number?: string;
  };
}

export class FindymailService {
  private static readonly BASE_URL = 'https://app.findymail.com/api';
  static readonly supportsValidation = true;

  /**
   * Check health/credits of the Findymail service
   */
  static async checkHealth(apiKey: string): Promise<FindymailHealthCheck> {
    const startTime = Date.now();
    try {
      const response = await fetch(`${this.BASE_URL}/credits`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        return {
          isHealthy: false,
          status: 'unhealthy',
          message: `API error: ${response.status} ${response.statusText}`,
          responseTime
        };
      }

      const data = await response.json() as FindymailCreditsResponse;
      
      // Consider the service unhealthy if there are no credits available
      if (data.credits <= 0 && data.verifier_credits <= 0) {
        return {
          isHealthy: false,
          status: 'unhealthy',
          message: 'No credits available',
          credits: data.credits,
          verifier_credits: data.verifier_credits,
          responseTime
        };
      }

      return {
        isHealthy: true,
        status: 'healthy',
        message: `Service is healthy. Available credits: ${data.credits}, Verifier credits: ${data.verifier_credits}`,
        credits: data.credits,
        verifier_credits: data.verifier_credits,
        responseTime
      };
    } catch (error: any) {
      return {
        isHealthy: false,
        status: 'unhealthy',
        message: `Connection error: ${error.message}`,
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Validate API key (alias for checkHealth for consistency)
   */
  static async validateApiKey(apiKey: string): Promise<FindymailHealthCheck> {
    return this.checkHealth(apiKey);
  }

  /**
   * Find email by name and domain
   */
  static async findEmailByName(apiKey: string, name: string, domain: string): Promise<FindymailSearchResponse> {
    const response = await fetch(`${this.BASE_URL}/search/name`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        name,
        domain,
        webhook_url: null
      })
    });

    if (!response.ok) {
      if (response.status === 402) {
        throw new Error('Not enough credits');
      }
      if (response.status === 423) {
        throw new Error('Subscription is paused');
      }
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as FindymailApiResponse;
    return {
      success: true,
      data: {
        contact: {
          id: data.contact.id,
          name: data.contact.name,
          email: data.contact.email,
          domain: data.contact.domain,
          company: data.contact.company,
          linkedin_url: data.contact.linkedin_url || null,
          job_title: data.contact.job_title || null,
          company_city: data.contact.company_city || '',
          company_region: data.contact.company_region || '',
          company_country: data.contact.company_country || '',
          city: data.contact.city || null,
          region: data.contact.region || null,
          country: data.contact.country || null,
          phone_number: data.contact.phone_number || null
        }
      }
    };
  }

  /**
   * Get supported actions for Findymail service
   */
  static getSupportedActions(): string[] {
    return ['findEmailByName'];
  }

  /**
   * Execute actions using Findymail integration
   */
  static async executeAction(apiKey: string, action: string, payload: any): Promise<any> {
    try {
      switch (action) {
        case 'findEmailByName':
          return await this.findEmailByName(apiKey, payload.name, payload.domain);
        default:
          throw new Error(`Unsupported action: ${action}`);
      }
    } catch (error: any) {
      return {
        success: false,
        action,
        error: error.message
      };
    }
  }
} 