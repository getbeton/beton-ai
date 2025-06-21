import express from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  AuthenticatedRequest, 
  ApiResponse, 
  CreateIntegrationRequest,
  UpdateIntegrationRequest,
  CreateApiKeyRequest,
  UpdateApiKeyRequest
} from '../types';

// Response types that match what we actually select from the database
interface ApiKeyResponse {
  id: string;
  keyType: string;
  isActive: boolean;
  lastUsed: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface IntegrationResponse {
  id: string;
  userId: string;
  serviceName: string;
  name: string;
  isActive: boolean;
  lastHealthCheck: Date | null;
  healthStatus: string;
  keySource: string;
  platformKeyId: string | null;
  createdAt: Date;
  updatedAt: Date;
  apiKeys?: ApiKeyResponse[];
  platformKey?: {
    id: string;
    serviceName: string;
    isActive: boolean;
    description: string | null;
    rateLimit: number | null;
    usageCount: number;
  } | null;
}
import { ApolloService } from '../services/apolloService';
import { ServiceFactory } from '../services/serviceFactory';

const router = express.Router();
const prisma = new PrismaClient();

// Get all integrations for the authenticated user
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const integrations = await prisma.integration.findMany({
      where: { userId },
      include: {
        apiKeys: {
          select: {
            id: true,
            keyType: true,
            isActive: true,
            lastUsed: true,
            createdAt: true,
            updatedAt: true
            // Don't include the actual API key for security
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const response: ApiResponse = {
      success: true,
      data: integrations
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching integrations:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch integrations' 
    });
  }
});

// Get available platform API keys for a service
router.get('/platform-keys/:serviceName', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { serviceName } = req.params;

    const platformKeys = await prisma.platformApiKey.findMany({
      where: { 
        serviceName,
        isActive: true 
      },
      select: {
        id: true,
        serviceName: true,
        isActive: true,
        description: true,
        rateLimit: true,
        usageCount: true
        // Don't include the actual API key for security
      },
      orderBy: { createdAt: 'desc' }
    });

    const response: ApiResponse = {
      success: true,
      data: platformKeys
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching platform keys:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch platform keys' 
    });
  }
});

// Get a specific integration
router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const integrationId = req.params.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const integration = await prisma.integration.findFirst({
      where: { 
        id: integrationId,
        userId 
      },
      include: {
        apiKeys: {
          select: {
            id: true,
            keyType: true,
            isActive: true,
            lastUsed: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    });

    if (!integration) {
      return res.status(404).json({ 
        success: false, 
        error: 'Integration not found' 
      });
    }

    const response: ApiResponse = {
      success: true,
      data: integration
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching integration:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch integration' 
    });
  }
});

// Create a new integration
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { serviceName, name, keySource, platformKeyId, apiKeys }: CreateIntegrationRequest = req.body;

    // Validate required fields
    if (!serviceName || !name || !keySource) {
      return res.status(400).json({ 
        success: false, 
        error: 'serviceName, name, and keySource are required' 
      });
    }

    // Validate based on key source
    if (keySource === 'platform') {
      if (!platformKeyId) {
        return res.status(400).json({ 
          success: false, 
          error: 'platformKeyId is required when using platform keys' 
        });
      }

      // Verify platform key exists and is active
      const platformKey = await prisma.platformApiKey.findFirst({
        where: { 
          id: platformKeyId,
          serviceName,
          isActive: true 
        }
      });

      if (!platformKey) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid or inactive platform key' 
        });
      }
    } else if (keySource === 'personal') {
      if (!apiKeys || apiKeys.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'apiKeys are required when using personal keys' 
        });
      }

      // Validate personal API keys if the service supports validation
      if (ServiceFactory.supportsValidation(serviceName)) {
        for (const apiKey of apiKeys) {
          console.log(`Validating ${serviceName} API key...`);
          const validationResult = await ServiceFactory.validateApiKey(serviceName, apiKey.apiKey);
          
          if (!validationResult.isHealthy) {
            return res.status(400).json({ 
              success: false, 
              error: `API key validation failed: ${validationResult.message}`,
              details: {
                service: serviceName,
                status: validationResult.status,
                responseTime: validationResult.responseTime
              }
            });
          }
          console.log(`${serviceName} API key validation successful`);
        }
      }
    }

    // Create integration
    const integrationData: any = {
      userId,
      serviceName,
      name,
      keySource,
      ...(keySource === 'platform' && { platformKeyId }),
      ...(keySource === 'personal' && apiKeys && {
        apiKeys: {
          create: apiKeys.map(key => ({
            apiKey: key.apiKey, // In production, this should be encrypted
            keyType: key.keyType
          }))
        }
      })
    };

    const integration = await prisma.integration.create({
      data: integrationData,
      include: {
        apiKeys: {
          select: {
            id: true,
            keyType: true,
            isActive: true,
            lastUsed: true,
            createdAt: true,
            updatedAt: true
          }
        },
        platformKey: {
          select: {
            id: true,
            serviceName: true,
            isActive: true,
            description: true,
            rateLimit: true,
            usageCount: true
          }
        }
      }
    });

    // Update platform key usage count if using platform key
    if (keySource === 'platform' && platformKeyId) {
      await prisma.platformApiKey.update({
        where: { id: platformKeyId },
        data: { usageCount: { increment: 1 } }
      });
    }

    // Perform health check for the new integration
    if (serviceName === 'apollo') {
      try {
        let apiKeyToTest = '';
        
        if (keySource === 'platform' && platformKeyId) {
          // Get the actual platform key for health check (backend only)
          const fullPlatformKey = await prisma.platformApiKey.findUnique({
            where: { id: platformKeyId }
          });
          apiKeyToTest = fullPlatformKey?.apiKey || '';
        } else if (keySource === 'personal' && apiKeys && apiKeys.length > 0) {
          apiKeyToTest = apiKeys[0].apiKey;
        }

        if (apiKeyToTest) {
          const healthCheck = await ApolloService.checkHealth(apiKeyToTest);
          await prisma.integration.update({
            where: { id: integration.id },
            data: {
              healthStatus: healthCheck.status,
              lastHealthCheck: new Date()
            }
          });
          integration.healthStatus = healthCheck.status;
          integration.lastHealthCheck = new Date();
        }
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }

    const response: ApiResponse<IntegrationResponse> = {
      success: true,
      data: integration,
      message: 'Integration created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating integration:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create integration' 
    });
  }
});

// Update an integration
router.put('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const integrationId = req.params.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { name, isActive, keySource, platformKeyId }: UpdateIntegrationRequest = req.body;

    // Check if integration exists and belongs to user
    const existingIntegration = await prisma.integration.findFirst({
      where: { 
        id: integrationId,
        userId 
      }
    });

    if (!existingIntegration) {
      return res.status(404).json({ 
        success: false, 
        error: 'Integration not found' 
      });
    }

    // If changing to platform key, validate platform key
    if (keySource === 'platform' && platformKeyId) {
      const platformKey = await prisma.platformApiKey.findFirst({
        where: { 
          id: platformKeyId,
          serviceName: existingIntegration.serviceName,
          isActive: true 
        }
      });

      if (!platformKey) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid or inactive platform key' 
        });
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (keySource) updateData.keySource = keySource;
    if (keySource === 'platform' && platformKeyId) {
      updateData.platformKeyId = platformKeyId;
    } else if (keySource === 'personal') {
      updateData.platformKeyId = null;
    }

    const integration = await prisma.integration.update({
      where: { id: integrationId },
      data: updateData,
      include: {
        apiKeys: {
          select: {
            id: true,
            keyType: true,
            isActive: true,
            lastUsed: true,
            createdAt: true,
            updatedAt: true
          }
        },
        platformKey: {
          select: {
            id: true,
            serviceName: true,
            isActive: true,
            description: true,
            rateLimit: true,
            usageCount: true
          }
        }
      }
    });

    const response: ApiResponse<IntegrationResponse> = {
      success: true,
      data: integration,
      message: 'Integration updated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating integration:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update integration' 
    });
  }
});

// Delete an integration
router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const integrationId = req.params.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Check if integration exists and belongs to user
    const existingIntegration = await prisma.integration.findFirst({
      where: { 
        id: integrationId,
        userId 
      }
    });

    if (!existingIntegration) {
      return res.status(404).json({ 
        success: false, 
        error: 'Integration not found' 
      });
    }

    // Decrease platform key usage count if using platform key
    if (existingIntegration.keySource === 'platform' && existingIntegration.platformKeyId) {
      await prisma.platformApiKey.update({
        where: { id: existingIntegration.platformKeyId },
        data: { usageCount: { decrement: 1 } }
      });
    }

    await prisma.integration.delete({
      where: { id: integrationId }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Integration deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting integration:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete integration' 
    });
  }
});

// Validate API key for a service (before creating integration)
router.post('/validate-key', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { serviceName, apiKey } = req.body;

    if (!serviceName || !apiKey) {
      return res.status(400).json({ 
        success: false, 
        error: 'serviceName and apiKey are required' 
      });
    }

    // Check if service supports validation
    if (!ServiceFactory.supportsValidation(serviceName)) {
      return res.status(400).json({ 
        success: false, 
        error: `Service ${serviceName} does not support API key validation` 
      });
    }

    // Validate the API key
    const validationResult = await ServiceFactory.validateApiKey(serviceName, apiKey);

    const response: ApiResponse = {
      success: validationResult.isHealthy,
      data: validationResult,
      message: validationResult.isHealthy ? 'API key is valid' : 'API key validation failed'
    };

    res.json(response);
  } catch (error) {
    console.error('Error validating API key:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to validate API key' 
    });
  }
});

// Health check for an integration
router.post('/:id/health-check', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const integrationId = req.params.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const integration = await prisma.integration.findFirst({
      where: { 
        id: integrationId,
        userId 
      },
      include: {
        apiKeys: {
          where: { isActive: true },
          take: 1
        },
        platformKey: true
      }
    });

    if (!integration) {
      return res.status(404).json({ 
        success: false, 
        error: 'Integration not found' 
      });
    }

    let apiKeyToTest = '';

    if (integration.keySource === 'platform' && integration.platformKey) {
      apiKeyToTest = integration.platformKey.apiKey;
    } else if (integration.keySource === 'personal' && integration.apiKeys && integration.apiKeys.length > 0) {
      apiKeyToTest = integration.apiKeys[0].apiKey;
    }

    if (!apiKeyToTest) {
      return res.status(400).json({ 
        success: false, 
        error: 'No API key available for health check' 
      });
    }

    let healthCheck;
    
    // Perform service-specific health check
    switch (integration.serviceName) {
      case 'apollo':
        healthCheck = await ApolloService.checkHealth(apiKeyToTest);
        break;
      default:
        return res.status(400).json({ 
          success: false, 
          error: `Health check not supported for service: ${integration.serviceName}` 
        });
    }

    // Update integration with health check results
    await prisma.integration.update({
      where: { id: integrationId },
      data: {
        healthStatus: healthCheck.status,
        lastHealthCheck: new Date()
      }
    });

    const response: ApiResponse = {
      success: true,
      data: healthCheck,
      message: 'Health check completed'
    };

    res.json(response);
  } catch (error) {
    console.error('Error performing health check:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to perform health check' 
    });
  }
});

export default router; 