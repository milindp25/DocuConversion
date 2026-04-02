# DocuConversion

Freemium PDF toolbox — Next.js 15 frontend + FastAPI backend, deployed on Railway.

## Architecture

- **Frontend**: `frontend/` — Next.js 15 App Router, TypeScript, Tailwind, shadcn/ui
- **Backend**: `backend/` — FastAPI, PyMuPDF (fitz), pydantic-settings, SQLAlchemy
- **Storage**: Cloudflare R2 (S3-compatible)
- **Database**: Aiven PostgreSQL
- **Auth**: NextAuth.js v5 (Google OAuth) → JWT verified by backend

## Environment Variables

- Frontend reads `frontend/.env.local` — NOT root `.env`
- Backend reads `backend/.env` — NOT root `.env`
- Next.js public vars must be prefixed `NEXT_PUBLIC_`
- Sentry DSNs differ between frontend and backend (separate projects)

## Backend Conventions

- `logger.exception("message")` for error logging — never `logger.error("...", str(e))`
- Correlation IDs via `request_id_ctx` ContextVar — set in middleware, auto-propagated through async
- FastAPI `Form(...)` param names must match frontend FormData field names exactly
- JSON structured logging in production (`LOG_FORMAT=json`), text in development

## Frontend Conventions

- `processFile()` options object keys must match backend Form field names
- Cross-origin downloads require server-side proxy (`/api/download/route.ts`)
- URL validation must use `new URL()` hostname parsing — never substring matching
- PostHog analytics: autocapture + manual `$pageview` for SPA route changes

## Testing

- `cd backend && python -m pytest` — backend tests
- `cd frontend && npm run build` — frontend type-check + build
- Use `curl` for end-to-end API testing against running backend

## Common Gotchas

- Windows: killed processes may hold ports for seconds — use alternative port or wait
- PDF coordinate systems: avoid hardcoded aspect ratios; use `w-full h-auto` for natural sizing
- `object-contain` causes letterboxing that breaks coordinate mapping for drag interactions
