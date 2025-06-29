import { Router } from 'express';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'beton-ai-backend',
    version: process.env.npm_package_version || '1.0.0'
  });
});

export default router; 