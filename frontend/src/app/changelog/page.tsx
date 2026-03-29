/**
 * Changelog page for DocuConversion.
 * Displays a timeline of product updates and feature releases
 * organized by phase and date.
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog",
  description:
    "See what's new in DocuConversion. A timeline of product updates, new features, and improvements.",
};

/** A single changelog entry */
interface ChangelogEntry {
  date: string;
  title: string;
  features: string[];
}

/** Changelog entries in reverse chronological order */
const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    date: "March 2026",
    title: "Phase 3: AI Features, Developer API & Share Links",
    features: [
      "AI-powered document summarization and Q&A",
      "Developer REST API with token-based authentication",
      "Shareable download links for processed documents",
      "Batch processing for bulk file operations",
      "OCR support for scanned PDF documents",
    ],
  },
  {
    date: "March 2026",
    title: "Phase 2: Authentication, PDF to Excel & PowerPoint",
    features: [
      "User authentication with Google and GitHub SSO",
      "PDF to Excel conversion with table detection",
      "PDF to PowerPoint conversion with slide rendering",
      "User dashboard with conversion history",
      "Increased file size limits for registered users",
    ],
  },
  {
    date: "March 2026",
    title: "Phase 1: Core Conversion, Editing, Signing & Compression",
    features: [
      "PDF to Word, Image, and Text conversion",
      "Word, Image, and HTML to PDF conversion",
      "Merge multiple PDFs into a single document",
      "Split PDFs by page ranges or individual pages",
      "Compress PDFs with adjustable quality levels",
      "Rotate PDF pages by 90, 180, or 270 degrees",
      "Dark theme with responsive mobile layout",
      "Drag-and-drop file upload with validation",
    ],
  },
];

/**
 * Renders the changelog page with a vertical timeline of product updates.
 */
export default function ChangelogPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Changelog
        </h1>
        <p className="mt-3 text-base text-gray-600 dark:text-gray-400">
          A timeline of updates and new features in DocuConversion.
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div
          className="absolute left-4 top-0 h-full w-0.5 bg-gray-200 dark:bg-gray-800"
          aria-hidden="true"
        />

        <div className="space-y-12">
          {CHANGELOG_ENTRIES.map((entry, idx) => (
            <article
              key={idx}
              className="relative pl-12"
              aria-label={`${entry.date}: ${entry.title}`}
            >
              {/* Timeline dot */}
              <div
                className="absolute left-2.5 top-1.5 h-3 w-3 rounded-full border-2 border-blue-500 bg-white dark:border-blue-400 dark:bg-gray-950"
                aria-hidden="true"
              />

              {/* Date badge */}
              <time className="mb-2 inline-block rounded-full bg-blue-50 px-3 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {entry.date}
              </time>

              {/* Entry title */}
              <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                {entry.title}
              </h2>

              {/* Feature list */}
              <ul className="mt-3 space-y-1.5">
                {entry.features.map((feature, fIdx) => (
                  <li
                    key={fIdx}
                    className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                  >
                    <span
                      className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400 dark:bg-gray-600"
                      aria-hidden="true"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
