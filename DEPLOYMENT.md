# DocuConversion — Deployment Guide

## Architecture

```
Users → Vercel (frontend) → Railway (backend) → Cloudflare R2 (files)
                ↓                   ↓
          NextAuth.js          Aiven PostgreSQL
          (Google OAuth)       (user data)
```

## Prerequisites

- GitHub account (repo: milindp25/DocuConversion)
- Vercel account (https://vercel.com)
- Railway account (https://railway.com)
- Aiven PostgreSQL already provisioned
- Cloudflare R2 bucket already created
- Google OAuth credentials configured
- Gemini API key

---

## Step 1: Deploy Backend to Railway

1. Go to https://railway.com → "New Project" → "Deploy from GitHub Repo"
2. Select `milindp25/DocuConversion`
3. Railway will detect the Dockerfile in `backend/`
4. Set the **Root Directory** to `backend`
5. Add these **Environment Variables** in Railway dashboard:

```
ENVIRONMENT=production
CORS_ORIGINS=["https://your-domain.vercel.app"]
DATABASE_URL=postgres://avnadmin:xxx@xxx.aivencloud.com:PORT/defaultdb?sslmode=require
R2_ACCESS_KEY_ID=your_r2_key
R2_SECRET_ACCESS_KEY=your_r2_secret
R2_BUCKET_NAME=docuconversion
R2_ENDPOINT_URL=https://xxx.r2.cloudflarestorage.com
GEMINI_API_KEY=your_gemini_key
MAX_UPLOAD_SIZE_MB=100
FILE_TTL_ANONYMOUS_HOURS=1
FILE_TTL_AUTHENTICATED_DAYS=30
AUTH_ENABLED=false
NEXTAUTH_SECRET=your_secret
```

6. Railway will auto-deploy. Note the generated URL (e.g., `https://docuconversion-backend-production.up.railway.app`)

---

## Step 2: Deploy Frontend to Vercel

1. Go to https://vercel.com → "Add New Project" → Import from GitHub
2. Select `milindp25/DocuConversion`
3. Set **Framework Preset** to "Next.js"
4. Set **Root Directory** to `frontend`
5. Add these **Environment Variables**:

```
BACKEND_URL=https://your-railway-url.up.railway.app
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
AUTH_SECRET=same_as_NEXTAUTH_SECRET
AUTH_URL=https://your-domain.vercel.app
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
AUTH_GOOGLE_ID=your_google_client_id
AUTH_GOOGLE_SECRET=your_google_client_secret
```

6. Click "Deploy"

---

## Step 3: Update OAuth Redirect URIs

In Google Cloud Console (https://console.cloud.google.com/apis/credentials):
- Add redirect URI: `https://your-domain.vercel.app/api/auth/callback/google`

In GitHub Developer Settings (if using GitHub OAuth):
- Update callback URL: `https://your-domain.vercel.app/api/auth/callback/github`

---

## Step 4: Update CORS

In Railway, update the `CORS_ORIGINS` env var to include your Vercel domain:
```
CORS_ORIGINS=["https://your-domain.vercel.app"]
```

---

## Step 5: Custom Domain (Optional)

### Vercel:
1. Project Settings → Domains → Add your domain
2. Update DNS records as instructed by Vercel

### Railway:
1. Settings → Networking → Custom Domain
2. Add your API subdomain (e.g., `api.yourdomain.com`)

---

## Environment Variable Reference

### Backend (Railway)

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
| `MAX_UPLOAD_SIZE_MB` | No | Default: 100 |

### Frontend (Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `BACKEND_URL` | Yes | Railway backend URL |
| `AUTH_SECRET` | Yes | NextAuth secret (same as NEXTAUTH_SECRET) |
| `AUTH_URL` | Yes | Your frontend URL |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `AUTH_GOOGLE_ID` | Yes | Same as GOOGLE_CLIENT_ID |
| `AUTH_GOOGLE_SECRET` | Yes | Same as GOOGLE_CLIENT_SECRET |
| `NEXT_PUBLIC_APP_URL` | Yes | Your frontend URL (public) |

---

## Monitoring

- **Backend health:** `GET https://your-railway-url/health`
- **API docs (dev only):** `https://your-railway-url/docs` (disabled in production)
- **Railway logs:** Railway dashboard → your service → Logs
- **Vercel logs:** Vercel dashboard → your project → Functions tab

---

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| CORS errors | Backend CORS_ORIGINS doesn't include frontend URL | Update CORS_ORIGINS in Railway |
| OAuth redirect mismatch | Google Console missing production redirect URI | Add `https://yourdomain/api/auth/callback/google` |
| Files not downloading | R2 credentials wrong or bucket doesn't exist | Verify R2 env vars in Railway |
| AI features return error | GEMINI_API_KEY missing or expired | Check key at aistudio.google.com |
| 502 on file upload | Backend crashed (check Railway logs) | Increase Railway memory or check logs |
