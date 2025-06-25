import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import integrationsRouter from './routes/integrations';
import authRouter from './routes/auth';
import platformKeysRouter from './routes/platformKeys';
import tablesRouter from './routes/tables';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',           // Frontend in development
    'http://localhost:3001',           // Backend (for testing)
    'https://yourdomain.com'           // Your actual production domain
  ],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'beton-ai-backend',
    mode: 'development'
  });
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/integrations', authMiddleware, integrationsRouter);
app.use('/api/platform-keys', authMiddleware, platformKeysRouter);
app.use('/api/tables', authMiddleware, tablesRouter);

// Test endpoint for JWT authentication status
app.get('/api/auth/test', authMiddleware, (req: any, res) => {
  res.json({
    success: true,
    message: 'JWT authentication is working',
    user: req.user
  });
});

// Test endpoint for integration creation (no auth required - for testing)
app.post('/api/test/integration', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const { serviceName, name, apiKey } = req.body;
    const testUserId = 'test-user-123'; // Mock user ID for testing
    
    if (!serviceName || !name || !apiKey) {
      return res.status(400).json({
        success: false,
        error: 'serviceName, name, and apiKey are required'
      });
    }
    
    const newIntegration = await prisma.integration.create({
      data: {
        userId: testUserId,
        serviceName,
        name,
        apiKeys: {
          create: [{
            apiKey: apiKey, // In production, this should be encrypted
            keyType: 'platform'
          }]
        }
      },
      include: {
        apiKeys: {
          select: {
            id: true,
            keyType: true,
            isActive: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    });
    
    res.status(201).json({
      success: true,
      data: newIntegration,
      message: 'Test integration created successfully'
    });
  } catch (error) {
    console.error('Test integration creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create test integration'
    });
  }
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
}); 