'use client'
/**
 * PostHog analytics provider.
 * Wraps the app with the PostHog React context and handles manual page-view
 * capture for Next.js App Router SPA navigation.
 */

import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { initPostHog, posthog } from '@/lib/posthog'

/**
 * Inner component that reads navigation hooks and fires $pageview events.
 * Wrapped in <Suspense> in PostHogProvider because useSearchParams()
 * requires a Suspense boundary in App Router.
 */
function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Initialise PostHog once when the component mounts on the client
  useEffect(() => {
    initPostHog()
  }, [])

  // Capture a manual $pageview on every route change
  useEffect(() => {
    if (!pathname) return
    const url =
      pathname +
      (searchParams?.toString() ? `?${searchParams.toString()}` : '')
    posthog.capture('$pageview', { $current_url: url })
  }, [pathname, searchParams])

  return null
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  )
}

// Re-export for convenience so components can do:
//   import { posthog } from '@/components/providers/PostHogProvider'
export { posthog }
