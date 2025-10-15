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

    res.json({
      success: true,
      data: {
        ...config,
        serviceHealth: {
          realService: 'healthy'
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
    const { mode } = req.body; // 'real'

    if (mode !== 'real') {
      return res.status(400).json({
        success: false,
        error: 'Invalid mode. Apollo integration only supports real mode'
      });
    }
    
    // Update environment variable for runtime
    process.env.APOLLO_MODE = 'real';
    
    console.log('🔧 Apollo mode locked to real');
    
    res.json({
      success: true,
      message: 'Apollo mode is locked to real API usage',
      data: { mode: 'real' }
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
    const { endpoint, mode } = req.body; // endpoint: string, mode: 'real'

    if (mode !== 'real') {
      return res.status(400).json({
        success: false,
        error: 'Invalid mode. Apollo endpoints only support real mode'
      });
    }
    
    // Set environment variable for specific endpoint
    const envKey = `APOLLO_${endpoint.replace(/[^A-Z]/g, '_').replace(/__+/g, '_').toUpperCase()}_MODE`;
    process.env[envKey] = 'real';
    
    console.log(`🔧 Apollo endpoint ${endpoint} locked to real mode`);
    
    res.json({
      success: true,
      message: `Apollo endpoint ${endpoint} mode locked to real`,
      data: { endpoint, mode: 'real', envKey }
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