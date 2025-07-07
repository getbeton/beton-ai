import express from 'express';
import { ServiceFactory } from '../services/serviceFactory';
import { LeadMagicEmailFinderRequest } from '../types';
import { authMiddleware as auth } from '../middleware/auth';

const router = express.Router();

// Health check endpoint
router.get('/health', auth, async (req, res) => {
  const apiKey = req.headers['x-leadmagic-api-key'] as string;
  
  if (!apiKey) {
    return res.status(400).json({ error: 'API key is required' });
  }

  const healthCheck = await ServiceFactory.validateApiKey('leadmagic', apiKey);
  res.json(healthCheck);
});

// Email finder endpoint
router.post('/find-email', auth, async (req, res) => {
  const apiKey = req.headers['x-leadmagic-api-key'] as string;
  
  if (!apiKey) {
    return res.status(400).json({ error: 'API key is required' });
  }

  const { firstName, lastName, domain, companyName } = req.body;

  if (!firstName || !lastName || (!domain && !companyName)) {
    return res.status(400).json({
      error: 'firstName, lastName, and either domain or companyName are required'
    });
  }

  const request: LeadMagicEmailFinderRequest = {
    firstName,
    lastName,
    domain,
    companyName
  };

  try {
    const result = await ServiceFactory.executeAction('leadmagic', apiKey, 'findEmail', request);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'An error occurred while finding email'
    });
  }
});

export default router; 