/**
 * Redirect: /dashboard/tables → /dashboard
 * 
 * This page now redirects to /dashboard for backward compatibility.
 * All tables functionality has been consolidated into the main dashboard page.
 */

'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function TablesRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Preserve query parameters when redirecting
    const params = new URLSearchParams(searchParams.toString());
    const queryString = params.toString();
    
    console.info('[TablesRedirect] Redirecting /dashboard/tables → /dashboard', {
      queryString: queryString || 'none'
    });
    
    // Use replace to avoid adding to browser history
    router.replace(`/dashboard${queryString ? `?${queryString}` : ''}`);
  }, [router, searchParams]);

  // Show loading indicator while redirecting
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
