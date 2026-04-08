# DocuConversion

Free, all-in-one PDF platform. Convert, edit, sign, organize, secure, and analyze PDFs — no account required for basic use. Files are processed server-side and auto-deleted after conversion.

**Live:** [docuconversion.com](https://docuconversion.com)

## Features

**30+ PDF tools** across seven categories:

| Category | Tools |
|----------|-------|
| **Convert** | PDF to Word, Excel, PowerPoint, Image, Text; Word/Excel/PowerPoint/Image/HTML to PDF |
| **Edit** | Visual PDF editor, add watermarks, page numbers |
| **Organize** | Merge, split, compress, rotate |
| **Sign** | Draw, type, or upload electronic signatures |
| **Secure** | Password-protect, unlock, redact |
| **AI** | Summarize, chat with PDF, extract structured data, OCR |
| **Advanced** | Compare PDFs, flatten, batch processing |

**Pricing tiers:** Free (50 ops/day, 10 MB limit), Pro, and Enterprise with higher limits, batch processing, and priority support.

## Architecture

```
Browser  -->  Next.js 15 (Vercel)  -->  FastAPI (Render)  -->  Cloudflare R2
                   |                         |
              NextAuth.js              Aiven PostgreSQL
            (Google OAuth)
                   |
         PostHog + Sentry
```

| Layer | Stack |
|-------|-------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | FastAPI, PyMuPDF (fitz), SQLAlchemy, Pydantic |
| Storage | Cloudflare R2 (S3-compatible) |
| Database | Aiven PostgreSQL |
| Auth | NextAuth.js v5 (Google OAuth) with JWT validation on backend |
| AI | Google Gemini API |
| Payments | Stripe |
| Monitoring | Sentry (errors), PostHog (analytics) |

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL (or Aiven connection string)
- Cloudflare R2 bucket (optional for local dev)

### Local Development

**Option 1: Docker Compose**

```bash
cp .env.example .env
# Fill in DATABASE_URL and R2 credentials in .env
docker-compose up --build
```

Frontend: http://localhost:3000 | Backend: http://localhost:8000

**Option 2: Run individually**

```bash
# Backend
cd backend
cp .env.example .env
# Fill in .env values
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
cp .env.example .env.local
# Fill in .env.local values
npm install
npm run dev
```

### Environment Variables

See `backend/.env.example` and `frontend/.env.example` for all variables. Key ones:

| Variable | Where | Purpose |
|----------|-------|---------|
| `DATABASE_URL` | Backend | PostgreSQL connection string |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Backend | Cloudflare R2 storage |
| `GEMINI_API_KEY` | Backend | AI features (summarize, chat, extract, OCR) |
| `NEXT_PUBLIC_API_URL` | Frontend | Backend URL for API calls |
| `AUTH_SECRET` | Frontend | NextAuth.js session encryption |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Frontend | Google OAuth |

## Project Structure

```
DocuConversion/
├── frontend/                # Next.js 15 App Router
│   ├── src/
│   │   ├── app/             # Pages and API routes
│   │   │   ├── tools/       # PDF tool pages (convert, edit, organize, etc.)
│   │   │   ├── blog/        # Blog with MDX-style posts
│   │   │   ├── dashboard/   # Authenticated user dashboard
│   │   │   ├── pricing/     # Pricing page with Stripe integration
│   │   │   ├── privacy/     # Privacy Policy
│   │   │   └── terms/       # Terms of Service
│   │   ├── components/      # React components (ui, tools, editor, ai, seo)
│   │   ├── hooks/           # Custom hooks (useFileProcessor, useAiProcessor)
│   │   └── lib/             # Utilities (auth, constants, seo, signatures)
│   └── public/              # Static assets
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── api/             # Route handlers (convert, edit, organize, etc.)
│   │   ├── core/            # Config, auth, rate limiter, logging, exceptions
│   │   ├── models/          # Pydantic schemas, SQLAlchemy models
│   │   └── services/        # Business logic (converter, editor, ai_service, etc.)
│   └── schema.sql           # Database schema
├── docker-compose.yml       # Local development with Docker
└── DEPLOYMENT.md            # Production deployment guide
```

## Testing

```bash
# Backend tests
cd backend && python -m pytest

# Frontend type-check + build
cd frontend && npm run build
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for the full production deployment guide covering:

- Backend deployment to Render
- Frontend deployment to Vercel
- OAuth redirect configuration
- CORS setup
- Environment variable reference
- Monitoring and troubleshooting

## License

All rights reserved.
