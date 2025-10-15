import { apolloConfig } from '../config/apolloConfig';

export class ApolloRouter {
  private static config = apolloConfig;
  
  static async routeRequest(endpoint: string, apiKey: string, payload: any) {
    console.log(`🌐 Routing Apollo request to real API: ${endpoint}`);

    try {
      return await this.callRealService(endpoint, apiKey, payload);
    } catch (error: any) {
      console.error(`❌ Apollo real service failed for ${endpoint}:`, error.message);
      throw error;
    }
  }
  
  private static async callRealService(endpoint: string, apiKey: string, payload: any) {
    const baseUrl = process.env.APOLLO_BASE_URL || this.config.realService.baseUrl;
    const realUrl = `${baseUrl}${endpoint}`;
    
    console.log(`🌐 Calling real Apollo API: ${realUrl}`);
    
    // Health endpoint uses GET, others use POST
    const isHealthEndpoint = endpoint.includes('/health');
    const method = isHealthEndpoint ? 'GET' : 'POST';
    
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'X-Api-Key': apiKey
      },
      signal: AbortSignal.timeout(this.config.realService.timeout)
    };
    
    // Only add JSON body for POST requests
    if (method === 'POST') {
      fetchOptions.headers = {
        ...fetchOptions.headers,
        'Content-Type': 'application/json'
      };
      fetchOptions.body = JSON.stringify(payload);
    }
    
    const response = await fetch(realUrl, fetchOptions);
    
    if (!response.ok) {
      throw new Error(`Real Apollo API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  }

  /**
   * Get current configuration for debugging/admin purposes
   */
  static getCurrentConfig() {
    return {
      ...this.config,
      currentMode: 'real'
    };
  }
} 