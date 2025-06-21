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

/**
 * Internal Apollo service - handles Apollo integrations within the monolith
 */
export class ApolloService {
  
  // Indicates this service supports API key validation
  static readonly supportsValidation = true;

  /**
   * Check if an Apollo API key is healthy by calling Apollo's health endpoint
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

      // Make actual request to Apollo health endpoint
      const response = await fetch('https://api.apollo.io/v1/auth/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Api-Key': apiKey.trim()
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        // Handle different HTTP status codes
        switch (response.status) {
          case 401:
            return {
              isHealthy: false,
              status: 'unhealthy',
              message: 'Invalid API key - authentication failed',
              responseTime
            };
          case 403:
            return {
              isHealthy: false,
              status: 'unhealthy',
              message: 'API key does not have required permissions',
              responseTime
            };
          case 429:
            return {
              isHealthy: false,
              status: 'unhealthy',
              message: 'Rate limit exceeded - try again later',
              responseTime
            };
          default:
            return {
              isHealthy: false,
              status: 'unhealthy',
              message: `Apollo API returned status ${response.status}`,
              responseTime
            };
        }
      }

      // Parse response body
      const data = await response.json();
      
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
   * Execute actions using Apollo integration
   * This is where actual Apollo operations would be implemented
   */
  static async executeAction(apiKey: string, action: string, payload: any) {
    try {
      // Mock implementation - replace with actual Apollo logic
      console.log(`Executing Apollo action: ${action} with key: ${apiKey.substring(0, 8)}...`);
      
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 50));
      
      return {
        success: true,
        action,
        result: `Apollo action '${action}' executed successfully`,
        data: payload
      };
      
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
      'graphql_query',
      'schema_introspection', 
      'performance_metrics',
      'error_tracking'
    ];
  }
} 