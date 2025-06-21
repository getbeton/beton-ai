import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Initialize Supabase client only if environment variables are properly set
let supabase: any = null;

if (process.env.SUPABASE_URL && 
    process.env.SUPABASE_ANON_KEY && 
    process.env.SUPABASE_URL !== 'your_supabase_url_here' &&
    process.env.SUPABASE_ANON_KEY !== 'your_supabase_anon_key_here') {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
}

// Verify token endpoint
router.post('/verify', authMiddleware, (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      user: (req as any).user
    },
    message: 'Token is valid'
  });
});

// Get user profile
router.get('/profile', authMiddleware, (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      user: (req as any).user
    }
  });
});

export default router; 