/**
 * Development Authentication Bypass
 * 
 * Provides mock authentication for local development to bypass Supabase login.
 * This allows testing the UI without requiring a Supabase account.
 * 
 * WARNING: This should NEVER be enabled in production!
 */

// Check if we're in development mode
export const isDevelopmentMode = (): boolean => {
  return process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEV_MODE === 'true';
};

// Mock user session for development
export const getMockSession = () => {
  if (!isDevelopmentMode()) {
    return null;
  }

  return {
    access_token: 'dev-mock-token',
    refresh_token: 'dev-mock-refresh',
    expires_in: 3600,
    token_type: 'bearer',
    user: {
      id: 'e72da235-26ec-449c-839f-b3ef797a1314', // Matches test data in database
      email: 'dev@beton-ai.local',
      user_metadata: {
        full_name: 'Development User',
        avatar_url: null,
      },
    },
  };
};

// Mock user for development
export const getMockUser = () => {
  const session = getMockSession();
  return session?.user || null;
};

/**
 * Check if user should be redirected to auth
 * Returns false in development mode to skip redirect
 */
export const shouldRedirectToAuth = (user: any): boolean => {
  // In development mode, never redirect
  if (isDevelopmentMode()) {
    console.log('[DevAuth] Development mode - skipping auth redirect');
    return false;
  }

  // In production, redirect if no user
  return !user;
};

