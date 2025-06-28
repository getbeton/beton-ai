import { apolloConfig } from '../config/apolloConfig';
import { PeopleSearchFilters, PeopleSearchResponse, ApolloHealthCheck } from './apolloService';

export class ApolloRouter {
  private static config = apolloConfig;
  
  static async routeRequest(endpoint: string, apiKey: string, payload: any) {
    const endpointConfig = this.config.endpoints[endpoint as keyof typeof this.config.endpoints];
    const mode = this.determineMode(endpoint, endpointConfig);
    
    console.log(`🔀 Routing Apollo request: ${endpoint} → ${mode}`);
    
    try {
      switch (mode) {
        case 'mock':
          return await this.callMockService(endpoint, payload);
        case 'real':
          return await this.callRealService(endpoint, apiKey, payload);
        default:
          throw new Error(`Unknown Apollo mode: ${mode}`);
      }
    } catch (error: any) {
      console.error(`❌ Apollo ${mode} service failed:`, error.message);
      throw error;
    }
  }
  
  private static determineMode(endpoint: string, endpointConfig: any): 'mock' | 'real' {
    // 1. Check environment variable override for specific endpoint
    const envKey = `APOLLO_${endpoint.replace(/[^A-Z]/g, '_').replace(/__+/g, '_').toUpperCase()}_MODE`;
    const envMode = process.env[envKey];
    if (envMode === 'mock' || envMode === 'real') {
      return envMode;
    }
    
    // 2. Check global environment mode
    const globalMode = process.env.APOLLO_MODE;
    if (globalMode === 'mock' || globalMode === 'real') {
      return globalMode;
    }
    
    // 3. Check endpoint-specific configuration
    if (endpointConfig?.mode === 'real') {
      return 'real';
    }
    
    if (endpointConfig?.mode === 'configurable') {
      return endpointConfig.default || 'mock';
    }
    
    // 4. Default to mock for safety
    return 'mock';
  }
  
  private static async callMockService(endpoint: string, payload: any) {
    // Use environment variable with fallback to config file
    const mockServiceUrl = process.env.MOCK_APOLLO_SERVICE_URL || this.config.mockService.url;
    const mockUrl = `${mockServiceUrl}${endpoint}`;
    
    console.log(`📡 Calling mock Apollo service: ${mockUrl}`);
    
    // Use environment variable for timeout with fallback to config
    const timeout = parseInt(process.env.MOCK_APOLLO_SERVICE_TIMEOUT || '30000') || this.config.mockService.timeout;
    
    const response = await fetch(mockUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeout)
    });
    
    if (!response.ok) {
      throw new Error(`Mock Apollo service error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  private static async callRealService(endpoint: string, apiKey: string, payload: any) {
    const realUrl = `${this.config.realService.baseUrl}${endpoint}`;
    
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
      currentMode: process.env.APOLLO_MODE || 'mixed',
      endpointModes: Object.keys(this.config.endpoints).reduce((acc, endpoint) => {
        acc[endpoint] = this.determineMode(endpoint, this.config.endpoints[endpoint as keyof typeof this.config.endpoints]);
        return acc;
      }, {} as Record<string, string>)
    };
  }

  /**
   * Check if mock Apollo service is available
   */
  static async checkMockServiceHealth(): Promise<boolean> {
    try {
      // Use environment variable with fallback to config file
      const mockServiceUrl = process.env.MOCK_APOLLO_SERVICE_URL || this.config.mockService.url;
      const response = await fetch(`${mockServiceUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
} 