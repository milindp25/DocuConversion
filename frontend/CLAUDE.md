@AGENTS.md

## Frontend-Specific

- Form field names in `processFile()` must exactly match FastAPI `Form(...)` parameter names
- Download proxy (`/api/download/route.ts`): validate URLs via `new URL().hostname` — never substring
- PostHog: wrap app in `PostHogProvider`, fire `$pageview` on route change via `usePathname`
- Sentry: `withSentryConfig` wraps `next.config.ts`; separate client/server/edge configs
- `ToolPageLayout` supports `wide` prop for tools needing more horizontal space
