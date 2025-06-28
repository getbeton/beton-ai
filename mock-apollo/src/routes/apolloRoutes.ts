import { Router, Request, Response } from 'express';
import { SearchService } from '../services/searchService';
import { PeopleSearchFilters, ApolloHealthCheck } from '../types/apollo';

const router = Router();

// Health check endpoint (mirrors Apollo's /v1/auth/health)
router.get('/v1/auth/health', async (req: Request, res: Response) => {
  try {
    // Apollo health endpoint returns a simple object with boolean values
    res.json({
      is_logged_in: true,
      credits_remaining: true,
      rate_limit_remaining: true
    });
  } catch (error) {
    res.status(500).json({
      is_logged_in: false,
      credits_remaining: false,
      rate_limit_remaining: false
    });
  }
});

// People search endpoint (mirrors Apollo's /api/v1/mixed_people/search)
router.post('/api/v1/mixed_people/search', async (req: Request, res: Response) => {
  try {
    const filters: PeopleSearchFilters = req.body;
    
    console.log('🔍 Mock Apollo People Search:', {
      filters: Object.keys(filters).filter(key => filters[key as keyof PeopleSearchFilters]).join(', '),
      page: filters.page || 1,
      per_page: filters.per_page || 25
    });
    
    const results = await SearchService.searchPeople(filters);
    res.json(results);
  } catch (error: any) {
    console.error('Mock Apollo search error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Service health check endpoint
router.get('/health', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    res.json({
      status: 'healthy',
      service: 'mock-apollo',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'unhealthy',
      service: 'mock-apollo',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      error: error.message
    });
  }
});

export default router;