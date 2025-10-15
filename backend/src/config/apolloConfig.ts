import * as fs from 'fs';
import * as path from 'path';

interface ApolloConfig {
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
export type { ApolloConfig };