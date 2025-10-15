'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { PropsWithChildren, useEffect } from 'react';
import { initPosthog, posthog } from '@/lib/posthog';

export function PosthogProvider({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    initPosthog();
  }, []);

  useEffect(() => {
    if (!pathname) return;
    const url = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;
    posthog?.capture('$pageview', { $current_url: url });
  }, [pathname, searchParams]);

  return <>{children}</>;
}

