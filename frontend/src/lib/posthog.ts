/**
 * PostHog analytics client singleton.
 * Initialised once on the client side; safe to import anywhere —
 * the guard inside initPostHog() prevents SSR execution.
 */

import posthog from 'posthog-js'

export function initPostHog() {
  if (typeof window === 'undefined') return
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com',
    capture_pageview: false,   // manual in PostHogProvider
    capture_pageleave: true,
    autocapture: true,
    persistence: 'localStorage+cookie',
    loaded: (ph) => {
      if (process.env.NODE_ENV === 'development') ph.debug()
    },
  })
}

export { posthog }
