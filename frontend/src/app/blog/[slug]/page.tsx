/**
 * Dynamic blog article page for DocuConversion.
 * Renders individual blog posts based on the URL slug.
 * Uses generateStaticParams to pre-render all known articles at build time.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";

/** Shape of a blog article including full body content */
interface BlogArticleData {
  slug: string;
  title: string;
  date: string;
  author: string;
  description: string;
  /** Paragraphs of article body text */
  body: string[];
  /** CTA link to the relevant tool */
  ctaHref: string;
  /** CTA button label */
  ctaLabel: string;
}

/** All available blog articles keyed by slug */
const ARTICLES: Record<string, BlogArticleData> = {
  "pdf-to-word-guide": {
    slug: "pdf-to-word-guide",
    title: "How to Convert PDF to Word Without Losing Formatting",
    date: "2024-12-15",
    author: "DocuConversion Team",
    description:
      "Preserve fonts, tables, and images when converting PDF documents to editable Word files.",
    body: [
      "Converting a PDF to a Word document sounds simple, but anyone who has tried it knows the frustration of broken tables, misaligned images, and missing fonts. The root cause is that PDF is a fixed-layout format designed for printing, while Word is a flow-based format designed for editing. Bridging those two worlds requires intelligent parsing of the PDF structure rather than a naive text dump.",
      "The most reliable approach is to use a converter that understands the internal structure of PDF pages, including text runs, font metadata, embedded images, and table boundaries. Tools that simply extract raw text and drop it into a Word file lose all visual structure. A high-quality converter reconstructs paragraphs, applies the closest matching fonts, re-creates table grids, and positions images relative to the text that surrounds them.",
      "Before converting, check whether your PDF was created from a digital source (such as a Word file exported to PDF) or from a scanned document. Digitally created PDFs contain selectable text and convert with high fidelity. Scanned PDFs are essentially images and require optical character recognition (OCR) to extract the text first. Running OCR before conversion dramatically improves results for scanned documents.",
      "For the best outcome, upload your PDF to a purpose-built converter, select Word as the output format, and download the result. Review the output for any formatting issues, especially around complex tables and multi-column layouts, and make minor adjustments as needed. With the right tool, most documents convert in seconds with formatting intact.",
    ],
    ctaHref: "/tools/convert/pdf-to-word",
    ctaLabel: "Convert PDF to Word now",
  },
  "compress-pdf-guide": {
    slug: "compress-pdf-guide",
    title: "5 Ways to Compress PDF Files for Free",
    date: "2024-12-10",
    author: "DocuConversion Team",
    description:
      "Reduce PDF file size for email attachments, web uploads, and faster sharing.",
    body: [
      "Large PDF files are one of the most common pain points in everyday document workflows. Email providers cap attachment sizes at 20-25 MB, web upload forms often impose even tighter limits, and bloated PDFs slow down page loads when embedded in websites. Fortunately, there are several effective ways to shrink a PDF without destroying its visual quality.",
      "The first and simplest approach is to use an online compression tool that re-encodes images at a lower resolution and strips unused metadata. Most compression tools offer multiple quality levels, from light compression that barely changes the visual output to aggressive compression that can cut file size by over 70 percent. For documents that are mostly text, even light compression can reduce size significantly because it removes orphaned objects and optimizes internal streams.",
      "If your PDF contains high-resolution photographs or scanned pages, downsampling images is where the biggest gains come from. A 300-DPI image is necessary for professional printing but far exceeds what a screen displays. Reducing images to 150 DPI cuts their data footprint roughly in half while remaining perfectly legible on monitors and tablets. Some tools let you choose the DPI target so you can balance quality against size.",
      "Other strategies include removing embedded fonts that are not used on any page, flattening transparent layers, and converting color spaces from CMYK to RGB when print fidelity is not required. Combining multiple techniques in a single pass typically yields the best compression ratio. Upload your PDF, pick a compression level, and download the optimized file in seconds.",
    ],
    ctaHref: "/tools/organize/compress",
    ctaLabel: "Compress your PDF for free",
  },
  "esignature-guide": {
    slug: "esignature-guide",
    title: "Electronic Signatures: A Complete Guide",
    date: "2024-12-05",
    author: "DocuConversion Team",
    description:
      "Understand the legal validity of electronic signatures and how to sign PDFs in seconds.",
    body: [
      "Electronic signatures have transformed the way businesses and individuals execute agreements. Instead of printing, signing, scanning, and emailing a document, you can apply a legally binding signature to a PDF in seconds from any device. The result is faster turnaround times, lower costs, and a fully digital paper trail.",
      "It is important to distinguish between an electronic signature and a digital signature. An electronic signature is any electronic indication of intent to agree, which can be as simple as a typed name, a drawn signature on a touchscreen, or an uploaded image of your handwriting. A digital signature, on the other hand, uses cryptographic certificates to verify the signer's identity and detect any tampering after the signature is applied. Both types are legally recognized in most jurisdictions, but digital signatures provide a higher level of assurance.",
      "In the United States, electronic signatures are governed by the ESIGN Act and the Uniform Electronic Transactions Act (UETA), which give electronic signatures the same legal standing as handwritten ones for most transactions. The European Union recognizes electronic signatures under the eIDAS regulation, which defines three tiers: simple, advanced, and qualified. For everyday contracts, NDAs, and consent forms, a simple electronic signature is sufficient.",
      "To sign a PDF electronically, upload the document to a signing tool, draw or type your signature, position it on the correct page, and save the result. The signed PDF can then be shared, stored, or submitted as a legally binding record. For added security, consider using a tool that embeds a tamper-evident seal so recipients can verify the document has not been altered after signing.",
    ],
    ctaHref: "/tools/sign/sign-pdf",
    ctaLabel: "Sign a PDF now",
  },
};

/** Pre-render all known blog article slugs at build time */
export function generateStaticParams() {
  return Object.keys(ARTICLES).map((slug) => ({ slug }));
}

/** Generate page metadata based on the article slug */
export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const article = ARTICLES[params.slug];
  if (!article) {
    return { title: "Article Not Found" };
  }

  return {
    title: `${article.title} | DocuConversion Blog`,
    description: article.description,
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      publishedTime: article.date,
      authors: [article.author],
    },
  };
}

/**
 * Renders a single blog article with title, date, author, body
 * paragraphs, and a call-to-action linking to the relevant tool.
 */
export default function BlogArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = ARTICLES[params.slug];

  if (!article) {
    notFound();
  }

  return (
    <div className="bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 min-h-screen">
      <article className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/blog"
          className="mb-8 inline-flex items-center gap-1 text-sm font-medium text-gray-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to blog
        </Link>

        {/* Article header */}
        <header className="mb-10">
          <time
            dateTime={article.date}
            className="text-xs font-medium uppercase tracking-wider text-gray-500"
          >
            {new Date(article.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {article.title}
          </h1>

          <p className="mt-3 text-sm text-gray-400">
            By {article.author}
          </p>
        </header>

        {/* Article body */}
        <div className="space-y-6">
          {article.body.map((paragraph, idx) => (
            <p
              key={idx}
              className="text-base leading-relaxed text-gray-300"
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-xl border border-gray-800/50 bg-gray-900/50 p-8 text-center">
          <p className="mb-4 text-lg font-semibold text-white">
            Ready to try it yourself?
          </p>
          <Link
            href={article.ctaHref}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all duration-200 hover:bg-blue-500 hover:shadow-xl hover:shadow-blue-600/30"
          >
            {article.ctaLabel}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </article>
    </div>
  );
}
