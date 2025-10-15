import { posthog } from './posthog';

type AnalyticsProperties = Record<string, any>;

export function captureUiEvent(event: string, properties: AnalyticsProperties = {}) {
  try {
    posthog?.capture(event, properties);
  } catch (error) {
    console.warn('PostHog capture failed', error);
  }
}

export function captureNavigation(label: string, href: string) {
  captureUiEvent('navigation_click', { label, href });
}

export function captureLandingAction(action: string) {
  captureUiEvent('landing_action', { action });
}



