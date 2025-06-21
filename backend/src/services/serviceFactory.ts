import { ApolloService, ApolloHealthCheck } from './apolloService';

export interface ServiceCapabilities {
  supportsValidation: boolean;
  validateApiKey?: (apiKey: string) => Promise<ApolloHealthCheck>;
}

export class ServiceFactory {
  private static services: Record<string, ServiceCapabilities> = {
    apollo: {
      supportsValidation: ApolloService.supportsValidation,
      validateApiKey: ApolloService.validateApiKey.bind(ApolloService)
    },
    openai: {
      supportsValidation: false
    },
    github: {
      supportsValidation: false
    }
  };

  /**
   * Get service capabilities for a given service name
   */
  static getService(serviceName: string): ServiceCapabilities | null {
    return this.services[serviceName.toLowerCase()] || null;
  }

  /**
   * Check if a service supports API key validation
   */
  static supportsValidation(serviceName: string): boolean {
    const service = this.getService(serviceName);
    return service?.supportsValidation || false;
  }

  /**
   * Validate an API key for a given service
   */
  static async validateApiKey(serviceName: string, apiKey: string): Promise<ApolloHealthCheck> {
    const service = this.getService(serviceName);
    
    if (!service) {
      return {
        isHealthy: false,
        status: 'unknown',
        message: `Unknown service: ${serviceName}`
      };
    }

    if (!service.supportsValidation || !service.validateApiKey) {
      return {
        isHealthy: false,
        status: 'unknown',
        message: `Service ${serviceName} does not support API key validation`
      };
    }

    return service.validateApiKey(apiKey);
  }

  /**
   * Get list of all supported services
   */
  static getSupportedServices(): string[] {
    return Object.keys(this.services);
  }

  /**
   * Get list of services that support validation
   */
  static getServicesWithValidation(): string[] {
    return Object.keys(this.services).filter(service => 
      this.services[service].supportsValidation
    );
  }
} 