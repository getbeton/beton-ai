import * as fs from 'fs';
import * as path from 'path';

interface ApolloEndpointConfig {
  mode: 'real' | 'configurable';
  default?: 'mock' | 'real';
  description: string;
}

interface ApolloConfig {
  mode: string;
  endpoints: Record<string, ApolloEndpointConfig>;
  mockService: {
    url: string;
    timeout: number;
    retries: number;
  };
  realService: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
}

// Load configuration from JSON file
function loadApolloConfig(): ApolloConfig {
  try {
    const configPath = path.join(__dirname, '../../config/apollo.json');
    const configFile = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configFile) as ApolloConfig;
  } catch (error) {
    console.warn('Failed to load apollo.json, using default configuration');
    // Return default configuration if file not found
    return {
      mode: 'mixed',
      endpoints: {
        '/api/v1/auth/health': {
          mode: 'real',
          description: 'Health checks always use real Apollo API'
        },
        '/api/v1/mixed_people/search': {
          mode: 'configurable',
          default: 'mock',
          description: 'People search can be mock or real based on environment'
        }
      },
      mockService: {
        url: 'http://mock-apollo:3002',
        timeout: 30000,
        retries: 3
      },
      realService: {
        baseUrl: 'https://api.apollo.io',
        timeout: 30000,
        retries: 1
      }
    };
  }
}

// Export the configuration
export const apolloConfig = loadApolloConfig();
export type { ApolloConfig, ApolloEndpointConfig }; 