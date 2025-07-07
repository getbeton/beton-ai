import { ApolloService, ApolloHealthCheck } from './apolloService';
import { OpenAIService } from './openaiService';
import { LeadMagicService } from './leadmagicService';
import { OpenAIHealthCheck, LeadMagicHealthCheck } from '../types';

// Union type for health check responses from different services
export type ServiceHealthCheck = ApolloHealthCheck | OpenAIHealthCheck | LeadMagicHealthCheck;

export interface ServiceCapabilities {
  supportsValidation: boolean;
  validateApiKey?: (apiKey: string) => Promise<ServiceHealthCheck>;
}

export class ServiceFactory {
  private static services: Record<string, ServiceCapabilities> = {
    apollo: {
      supportsValidation: ApolloService.supportsValidation,
      validateApiKey: ApolloService.validateApiKey.bind(ApolloService)
    },
    openai: {
      supportsValidation: OpenAIService.supportsValidation,
      validateApiKey: OpenAIService.validateApiKey.bind(OpenAIService)
    },
    leadmagic: {
      supportsValidation: LeadMagicService.supportsValidation,
      validateApiKey: LeadMagicService.validateApiKey.bind(LeadMagicService)
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
  static async validateApiKey(serviceName: string, apiKey: string): Promise<ServiceHealthCheck> {
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

  /**
   * Get service-specific actions
   */
  static getSupportedActions(serviceName: string): string[] {
    switch (serviceName.toLowerCase()) {
      case 'apollo':
        return ApolloService.getSupportedActions();
      case 'openai':
        return OpenAIService.getSupportedActions();
      case 'leadmagic':
        return LeadMagicService.getSupportedActions();
      default:
        return [];
    }
  }

  /**
   * Execute an action for a specific service
   */
  static async executeAction(serviceName: string, apiKey: string, action: string, payload: any) {
    switch (serviceName.toLowerCase()) {
      case 'apollo':
        return ApolloService.executeAction(apiKey, action, payload);
      case 'openai':
        return OpenAIService.executeAction(apiKey, action, payload);
      case 'leadmagic':
        return LeadMagicService.executeAction(apiKey, action, payload);
      default:
        throw new Error(`Service ${serviceName} does not support action execution`);
    }
  }
} 