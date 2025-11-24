import express from 'express';

import {
  AuthenticatedRequest,
  ApiResponse,
  CreatePlatformApiKeyRequest,
  UpdatePlatformApiKeyRequest
} from '../types';

const router = express.Router();
import prisma from '../lib/prisma';

// Middleware to check if user is admin (you can implement your own logic)
const requireAdmin = (req: AuthenticatedRequest, res: any, next: any) => {
  // For now, this is a placeholder. In production, implement proper admin check
  // You might check against a list of admin user IDs or roles
  const adminEmails = ['admin@beton-ai.com']; // Configure this in environment variables

  if (!req.user?.email || !adminEmails.includes(req.user.email)) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }

  next();
};

// Get all platform API keys (admin only)
router.get('/', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const platformKeys = await prisma.platformApiKey.findMany({
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

// Get platform API keys for a specific service (admin only)
router.get('/service/:serviceName', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { serviceName } = req.params;

    const platformKeys = await prisma.platformApiKey.findMany({
      where: { serviceName },
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

// Create a new platform API key (admin only)
router.post('/', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { serviceName, apiKey, description, rateLimit }: CreatePlatformApiKeyRequest = req.body;

    // Validate required fields
    if (!serviceName || !apiKey) {
      return res.status(400).json({
        success: false,
        error: 'serviceName and apiKey are required'
      });
    }

    // Check if platform key with same service already exists
    const existingKey = await prisma.platformApiKey.findUnique({
      where: {
        serviceName: serviceName
      }
    });

    if (existingKey) {
      return res.status(400).json({
        success: false,
        error: 'Platform key with this service already exists'
      });
    }

    const platformKey = await prisma.platformApiKey.create({
      data: {
        serviceName,
        apiKey, // In production, this should be encrypted
        description,
        rateLimit
      }
    });

    const response: ApiResponse = {
      success: true,
      data: platformKey,
      message: 'Platform API key created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating platform key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create platform key'
    });
  }
});

// Update a platform API key (admin only)
router.put('/:id', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const keyId = req.params.id;
    const { apiKey, isActive, description, rateLimit }: UpdatePlatformApiKeyRequest = req.body;

    // Check if platform key exists
    const existingKey = await prisma.platformApiKey.findUnique({
      where: { id: keyId }
    });

    if (!existingKey) {
      return res.status(404).json({
        success: false,
        error: 'Platform key not found'
      });
    }

    const updateData: any = {};
    if (apiKey) updateData.apiKey = apiKey; // In production, encrypt this
    if (isActive !== undefined) updateData.isActive = isActive;
    if (description !== undefined) updateData.description = description;
    if (rateLimit !== undefined) updateData.rateLimit = rateLimit;

    const platformKey = await prisma.platformApiKey.update({
      where: { id: keyId },
      data: updateData
    });

    const response: ApiResponse = {
      success: true,
      data: platformKey,
      message: 'Platform API key updated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating platform key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update platform key'
    });
  }
});

// Delete a platform API key (admin only)
router.delete('/:id', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const keyId = req.params.id;

    // Check if platform key exists
    const existingKey = await prisma.platformApiKey.findUnique({
      where: { id: keyId },
      include: {
        integrations: true
      }
    });

    if (!existingKey) {
      return res.status(404).json({
        success: false,
        error: 'Platform key not found'
      });
    }

    // Check if any integrations are using this key
    if (existingKey.integrations.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete platform key. It is being used by ${existingKey.integrations.length} integration(s)`
      });
    }

    await prisma.platformApiKey.delete({
      where: { id: keyId }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Platform API key deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting platform key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete platform key'
    });
  }
});

// Get usage statistics for platform keys (admin only)
router.get('/stats', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const stats = await prisma.platformApiKey.findMany({
      select: {
        id: true,
        serviceName: true,
        isActive: true,
        usageCount: true,
        rateLimit: true,
        description: true,
        _count: {
          select: {
            integrations: true
          }
        }
      },
      orderBy: { usageCount: 'desc' }
    });

    const response: ApiResponse = {
      success: true,
      data: stats
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching platform key stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch platform key statistics'
    });
  }
});

export default router; 