# DocuConversion — Deployment Guide

## Architecture

```
Users → Vercel (frontend) → Render (backend) → Cloudflare R2 (files)
                ↓                   ↓
          NextAuth.js          Aiven PostgreSQL
          (Google OAuth)       (user data)
                ↓
        PostHog (analytics)    Sentry (error monitoring)
```

## Prerequisites

- GitHub account (repo: milindp25/DocuConversion)
- Vercel account (https://vercel.com) — free Hobby plan
- Render account (https://render.com) — free tier or paid
- Aiven PostgreSQL already provisioned
- Cloudflare R2 bucket already created
- Google OAuth credentials configured
- Gemini API key
- Sentry account (https://sentry.io) — free Developer plan
- PostHog account (https://posthog.com) — free plan (1M events/month)

---

## Step 1: Deploy Backend to Render

1. Go to https://render.com → "New" → "Web Service" → Connect your GitHub repo
2. Select `milindp25/DocuConversion`
3. Set **Root Directory** to `backend`
4. Render auto-detects the Dockerfile (or use the `render.yaml` Blueprint for one-click setup)
5. Add these **Environment Variables** in the Render dashboard:

```
ENVIRONMENT=production
CORS_ORIGINS=["https://docuconversion.com"]
DATABASE_URL=postgres://avnadmin:xxx@xxx.aivencloud.com:PORT/defaultdb?sslmode=require
R2_ACCESS_KEY_ID=your_r2_key
R2_SECRET_ACCESS_KEY=your_r2_secret
R2_BUCKET_NAME=docuconversion
R2_ENDPOINT_URL=https://xxx.r2.cloudflarestorage.com
GEMINI_API_KEY=your_gemini_key
NEXTAUTH_SECRET=your_secret
AUTH_ENABLED=false
SHARE_LINK_BASE_URL=https://docuconversion.com/share
MAX_UPLOAD_SIZE_MB=100
LOG_LEVEL=INFO
LOG_FORMAT=json
SENTRY_DSN=https://your-backend-dsn@sentry.io/xxx
SENTRY_TRACES_SAMPLE_RATE=0.1
```

6. Click "Create Web Service" — Render builds and assigns a URL
7. Note the generated URL (e.g., `https://docuconversion-api.onrender.com`)

---

## Step 2: Deploy Frontend to Vercel

1. Go to https://vercel.com → "Add New Project" → Import from GitHub
2. Select `milindp25/DocuConversion`
3. Set **Framework Preset** to "Next.js"
4. Set **Root Directory** to `frontend`
5. Add these **Environment Variables**:

```
BACKEND_URL=https://docuconversion-api.onrender.com
NEXT_PUBLIC_API_URL=https://docuconversion-api.onrender.com
NEXT_PUBLIC_APP_URL=https://docuconversion.com
AUTH_SECRET=same_as_NEXTAUTH_SECRET
AUTH_URL=https://docuconversion.com
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
AUTH_GOOGLE_ID=your_google_client_id
AUTH_GOOGLE_SECRET=your_google_client_secret
NEXT_PUBLIC_POSTHOG_KEY=phc_your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
NEXT_PUBLIC_SENTRY_DSN=https://your-frontend-dsn@sentry.io/xxx
SENTRY_DSN=https://your-frontend-dsn@sentry.io/xxx
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=your-sentry-project-slug
SENTRY_AUTH_TOKEN=sntryu_your_auth_token
```

6. Click "Deploy"

---

## Step 3: Keep Backend Alive

**Render free tier** spins down after 15 min of inactivity. Use UptimeRobot:
1. Go to https://uptimerobot.com → Create a free account
2. Add a monitor: HTTP(s), URL = `https://your-backend-url/health`, interval = 5 min

---

## Step 4: Update OAuth Redirect URIs

In Google Cloud Console (https://console.cloud.google.com/apis/credentials):
- Add redirect URI: `https://your-domain.vercel.app/api/auth/callback/google`

In GitHub Developer Settings (if using GitHub OAuth):
- Update callback URL: `https://your-domain.vercel.app/api/auth/callback/github`

---

## Step 5: Update CORS

In Render, update the `CORS_ORIGINS` env var to include your Vercel domain:
```
CORS_ORIGINS=["https://your-domain.vercel.app"]
```

---

## Step 6: Custom Domain (Optional)

### Vercel:
1. Project Settings → Domains → Add your domain
2. Update DNS records as instructed by Vercel

### Render:
1. Your service → Settings → Custom Domains
2. Add your API subdomain (e.g., `api.yourdomain.com`)

---

## Environment Variable Reference

### Backend (Render)

| Variable | Required | Description |
|----------|----------|-------------|
| `ENVIRONMENT` | Yes | Set to `production` |
| `CORS_ORIGINS` | Yes | JSON array of allowed frontend origins |
| `DATABASE_URL` | Yes | Aiven PostgreSQL connection string |
| `R2_ACCESS_KEY_ID` | Yes | Cloudflare R2 access key |
| `R2_SECRET_ACCESS_KEY` | Yes | Cloudflare R2 secret key |
| `R2_BUCKET_NAME` | Yes | R2 bucket name |
| `R2_ENDPOINT_URL` | Yes | R2 endpoint URL |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `NEXTAUTH_SECRET` | Yes | Same secret as frontend AUTH_SECRET |
| `AUTH_ENABLED` | No | Set to `true` to enforce JWT validation |
| `SHARE_LINK_BASE_URL` | Yes | Frontend URL + `/share` (e.g., `https://docuconversion.com/share`) |
| `MAX_UPLOAD_SIZE_MB` | No | Default: 100 |
| `LOG_LEVEL` | No | Default: `INFO`. Options: `DEBUG`, `INFO`, `WARNING`, `ERROR` |
| `LOG_FORMAT` | No | Default: `text`. Set to `json` for structured logging in production |
| `SENTRY_DSN` | No | Backend Sentry DSN for error monitoring |
| `SENTRY_TRACES_SAMPLE_RATE` | No | Default: `0.1`. Fraction of requests traced (0.0–1.0) |

### Frontend (Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `BACKEND_URL` | Yes | Render backend URL (server-side only) |
| `NEXT_PUBLIC_API_URL` | Yes | Render backend URL (used in CSP header) |
| `NEXT_PUBLIC_APP_URL` | Yes | Your frontend URL (public) |
| `AUTH_SECRET` | Yes | NextAuth secret (same as NEXTAUTH_SECRET) |
| `AUTH_URL` | Yes | Your frontend URL |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `AUTH_GOOGLE_ID` | Yes | Same as GOOGLE_CLIENT_ID |
| `AUTH_GOOGLE_SECRET` | Yes | Same as GOOGLE_CLIENT_SECRET |
| `NEXT_PUBLIC_POSTHOG_KEY` | No | PostHog project API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | No | PostHog ingest host (e.g., `https://us.i.posthog.com`) |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Frontend Sentry DSN (public, used in browser) |
| `SENTRY_DSN` | No | Frontend Sentry DSN (server-side) |
| `SENTRY_ORG` | No | Sentry organization slug |
| `SENTRY_PROJECT` | No | Sentry project slug (must match Sentry dashboard exactly) |
| `SENTRY_AUTH_TOKEN` | No | Sentry auth token for source map uploads |

---

## Monitoring

- **Backend health:** `GET https://your-render-url/health`
- **API docs (dev only):** Disabled in production (`ENVIRONMENT=production`)
- **Render logs:** Render dashboard → your service → Logs
- **Vercel logs:** Vercel dashboard → your project → Functions tab
- **Sentry (errors):** https://sentry.io → separate projects for frontend and backend
- **PostHog (analytics):** https://us.posthog.com → Events, Sessions, Dashboards
- **Uptime alerts:** UptimeRobot sends email alerts if the backend goes down

---

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| CORS errors | `CORS_ORIGINS` doesn't include frontend URL | Update `CORS_ORIGINS` in Render dashboard |
| OAuth redirect mismatch | Google Console missing production redirect URI | Add `https://yourdomain/api/auth/callback/google` |
| Files not downloading | R2 credentials wrong or bucket doesn't exist | Verify R2 env vars in Render |
| AI features return error | `GEMINI_API_KEY` missing or expired | Check key at aistudio.google.com |
| First request slow (30-60s) | Render free tier cold start after sleep | Set up UptimeRobot keep-alive (see Step 3) |
| 502 on large file upload | Render free tier 512MB RAM exceeded | Reduce `MAX_UPLOAD_SIZE_MB` or upgrade Render plan |
| Share links show wrong URL | `SHARE_LINK_BASE_URL` not set | Set it to `https://your-domain.vercel.app/share` in Render |
| Build fails on Render | Docker build error | Check Render build logs; ensure `backend/` has all files |
| PostHog blocked by CSP | `connect-src` missing PostHog host | Ensure `next.config.ts` CSP includes `https://us.i.posthog.com` in connect-src |
| Sentry build error "Project not found" | `SENTRY_PROJECT` doesn't match Sentry dashboard slug | Copy exact slug from Sentry → Settings → Projects |
| Sentry source map upload fails | Missing or expired `SENTRY_AUTH_TOKEN` | Generate new token at sentry.io; build still succeeds (error is non-fatal) |
| Backend errors not in Sentry | `SENTRY_DSN` not set in Render | Add the backend Sentry DSN from your Sentry project settings |
| 429 rate limit errors | Free tier rate limit exceeded | Upgrade tier or reduce request frequency; check `rate_limiter.py` limits |
