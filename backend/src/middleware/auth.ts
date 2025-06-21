import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { AuthenticatedRequest } from '../types';

// Initialize Supabase client only if environment variables are properly set
let supabase: any = null;

if (process.env.SUPABASE_URL && 
    process.env.SUPABASE_SERVICE_ROLE_KEY && 
    process.env.SUPABASE_URL !== 'your_supabase_url_here' &&
    process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your_supabase_service_role_key_here') {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      return res.status(503).json({ 
        success: false, 
        error: 'Authentication service not configured. Please set up Supabase environment variables.' 
      });
    }

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token' 
      });
    }

    // Add user to request object
    req.user = {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.full_name || user.user_metadata?.name,
      avatar_url: user.user_metadata?.avatar_url
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ 
      success: false, 
      error: 'Authentication failed' 
    });
  }
}; 