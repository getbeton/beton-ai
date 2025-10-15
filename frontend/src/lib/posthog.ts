import posthog from 'posthog-js';
import { captureUiEvent } from './analytics';

let isInitialized = false;

export function initPosthog() {
  if (isInitialized) return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

  if (!key) {
    console.warn('PostHog key not set; analytics disabled');
    return;
  }

  posthog.init(key, {
    api_host: host,
    capture_pageview: true,
    capture_pageleave: true,
  });

  posthog.on('eventCaptured', (event) => {
    const eventName = (event as { event?: string } | undefined)?.event;
    if (eventName === '$pageview') {
      captureUiEvent('page_view');
    }
  });

  isInitialized = true;
}

export { posthog };

