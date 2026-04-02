/**
 * Sentry browser (client-side) initialisation.
 * This file is imported automatically by @sentry/nextjs — do not import it manually.
 * See: https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Capture a small fraction of transactions in production to keep quota low
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session Replay — low sample rate for normal sessions, full on error
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: false,
    }),
  ],

  // Disable entirely when no DSN is configured (local dev without .env)
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
})
