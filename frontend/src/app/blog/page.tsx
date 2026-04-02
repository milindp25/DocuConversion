/**
 * Blog listing page for DocuConversion.
 * Displays placeholder articles for SEO — each card links to a
 * full article on a topic relevant to PDF tools and workflows.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog — PDF Tips & Guides",
  description:
    "Learn how to convert, compress, and sign PDFs with free tips and step-by-step guides from the DocuConversion team.",
};

/** Blog article metadata used to render the listing cards */
interface BlogArticle {
  slug: string;
  title: string;
  date: string;
  description: string;
}

/** Placeholder articles for the initial blog launch */
const ARTICLES: BlogArticle[] = [
  {
    slug: "pdf-to-word-guide",
    title: "How to Convert PDF to Word Without Losing Formatting",
    date: "2024-12-15",
    description:
      "Preserve fonts, tables, and images when converting PDF documents to editable Word files. A step-by-step walkthrough using free online tools.",
  },
  {
    slug: "compress-pdf-guide",
    title: "5 Ways to Compress PDF Files for Free",
    date: "2024-12-10",
    description:
      "Reduce PDF file size for email attachments, web uploads, and faster sharing. Compare five proven methods from lossless to aggressive compression.",
  },
  {
    slug: "esignature-guide",
    title: "Electronic Signatures: A Complete Guide",
    date: "2024-12-05",
    description:
      "Understand the legal validity of electronic signatures, how they differ from digital signatures, and how to sign PDFs in seconds.",
  },
  {
    slug: "merge-pdf-guide",
    title: "How to Merge PDF Files Online — Step by Step Guide",
    date: "2024-11-28",
    description:
      "Combine multiple PDF documents into a single file in seconds. Learn when and why to merge PDFs, plus tips for keeping your pages in the right order.",
  },
  {
    slug: "watermark-pdf-guide",
    title: "How to Add Watermarks to PDF Documents",
    date: "2024-11-20",
    description:
      "Protect your intellectual property and brand your documents by adding text or image watermarks to any PDF. A practical guide with best practices.",
  },
  {
    slug: "ai-pdf-tools",
    title: "AI-Powered PDF Tools: The Future of Document Processing",
    date: "2024-11-15",
    description:
      "Discover how artificial intelligence is transforming PDF workflows, from intelligent OCR and auto-formatting to smart document comparison and data extraction.",
  },
] as const;

/**
 * Blog listing page. Renders a grid of article cards that link
 * to individual blog posts under /blog/[slug].
 */
export default function BlogPage() {
  return (
    <div className="bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-14 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Blog{" "}
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              — PDF Tips & Guides
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-gray-400">
            Practical guides and best practices for working with PDFs, documents, and digital signatures.
          </p>
        </div>

        {/* Article cards */}
        <div className="grid gap-6 sm:grid-cols-1">
          {ARTICLES.map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="group relative rounded-xl border border-gray-800/50 bg-gray-900/50 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-700 hover:shadow-lg hover:shadow-blue-500/5"
            >
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

              <h2 className="mt-2 text-xl font-semibold text-white group-hover:text-blue-400">
                {article.title}
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-gray-400">
                {article.description}
              </p>

              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-400 group-hover:text-blue-300">
                Read more
                <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
