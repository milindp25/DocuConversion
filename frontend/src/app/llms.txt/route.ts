/**
 * llms.txt — Machine-readable site description for AI search engines.
 * Serves a plain-text file at /llms.txt that helps AI crawlers
 * (Perplexity, ChatGPT web search, Bing Copilot) understand the site.
 */

export function GET() {
  const content = `# DocuConversion

> Free online PDF tools — convert, edit, sign, and organize PDFs. Fast, private, no account required.

## About

DocuConversion is a freemium SaaS platform that provides 30+ PDF tools in one place. All tools work directly in the browser with no software installation. Files are auto-deleted after processing for privacy.

## Core Features

- **Convert**: PDF to Word, Excel, PowerPoint, Images, and reverse conversions
- **Edit**: Add text, images, annotations, watermarks, and page numbers
- **Organize**: Merge, split, compress, rotate, and reorder PDF pages
- **Sign**: Draw, type, or upload electronic signatures with drag-to-place positioning
- **Secure**: Password-protect, unlock, and redact sensitive content
- **AI**: Summarize, chat with PDFs, extract data, and OCR
- **Advanced**: Compare PDFs side-by-side, flatten forms, batch process

## Pricing

- **Free**: $0/forever — 50 operations/day, 10 MB file limit
- **Pro**: $9/month — 100 operations/day, 50 MB limit, AI features, batch processing
- **Enterprise**: $29/month — Unlimited operations, 100 MB limit, API access, priority support

## Key URLs

- Homepage: https://www.docuconversion.com
- Pricing: https://www.docuconversion.com/pricing
- PDF to Word: https://www.docuconversion.com/tools/convert/pdf-to-word
- Merge PDF: https://www.docuconversion.com/tools/organize/merge
- Sign PDF: https://www.docuconversion.com/tools/sign/sign-pdf
- Compress PDF: https://www.docuconversion.com/tools/organize/compress
- Blog: https://www.docuconversion.com/blog

## Technical Details

- Frontend: Next.js (React) with server-side rendering
- Backend: FastAPI (Python) with PyMuPDF for PDF processing
- Storage: Cloudflare R2 with auto-expiry
- Privacy: Files deleted after processing, no persistent storage for free tier
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
