import { Router } from 'express';
import { ApolloRouter } from '../services/apolloRouter';
import { AuthenticatedRequest } from '../types';

const router = Router();

/**
 * Get current Apollo configuration
 */
router.get('/config', async (req: AuthenticatedRequest, res) => {
  try {
    const config = ApolloRouter.getCurrentConfig();
    
    // Add service health checks
    const mockServiceHealth = await ApolloRouter.checkMockServiceHealth();
    
    res.json({
      success: true,
      data: {
        ...config,
        serviceHealth: {
          mockService: mockServiceHealth ? 'healthy' : 'unhealthy'
        }
      }
    });
  } catch (error: any) {
    console.error('Error getting Apollo config:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update Apollo mode (runtime configuration)
 */
router.put('/config/mode', async (req: AuthenticatedRequest, res) => {
  try {
    const { mode } = req.body; // 'mock' | 'real' | 'mixed'
    
    if (!['mock', 'real', 'mixed'].includes(mode)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid mode. Must be one of: mock, real, mixed'
      });
    }
    
    // Update environment variable for runtime
    process.env.APOLLO_MODE = mode;
    
    console.log(`🔧 Apollo mode updated to: ${mode}`);
    
    res.json({
      success: true,
      message: `Apollo mode updated to: ${mode}`,
      data: { mode }
    });
  } catch (error: any) {
    console.error('Error updating Apollo mode:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update endpoint-specific mode
 */
router.put('/config/endpoint', async (req: AuthenticatedRequest, res) => {
  try {
    const { endpoint, mode } = req.body; // endpoint: string, mode: 'mock' | 'real'
    
    if (!['mock', 'real'].includes(mode)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid mode. Must be one of: mock, real'
      });
    }
    
    // Set environment variable for specific endpoint
    const envKey = `APOLLO_${endpoint.replace(/[^A-Z]/g, '_').replace(/__+/g, '_').toUpperCase()}_MODE`;
    process.env[envKey] = mode;
    
    console.log(`🔧 Apollo endpoint ${endpoint} mode updated to: ${mode}`);
    
    res.json({
      success: true,
      message: `Apollo endpoint ${endpoint} mode updated to: ${mode}`,
      data: { endpoint, mode, envKey }
    });
  } catch (error: any) {
    console.error('Error updating Apollo endpoint mode:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router; 