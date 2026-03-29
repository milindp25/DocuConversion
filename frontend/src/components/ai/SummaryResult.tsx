/**
 * Displays an AI-generated PDF summary in a formatted card.
 * Shows the summary text, page count badge, length indicator,
 * and a copy-to-clipboard button.
 */

"use client";

import { useCallback, useState } from "react";

import { Copy, Check, FileText, AlignLeft } from "lucide-react";

import { cn } from "@/lib/utils";

/** Props for the SummaryResult component */
export interface SummaryResultProps {
  /** The AI-generated summary text */
  summary: string;
  /** Number of pages in the source PDF */
  pageCount: number;
  /** Summary length setting (short, medium, detailed) */
  length: string;
}

/** Maps length values to human-readable labels */
const LENGTH_LABELS: Record<string, string> = {
  short: "Short",
  medium: "Medium",
  detailed: "Detailed",
};

/**
 * SummaryResult renders the AI-generated summary in a dark-themed card
 * with metadata badges and a copy-to-clipboard action.
 *
 * @example
 * ```tsx
 * <SummaryResult
 *   summary="This document covers..."
 *   pageCount={12}
 *   length="medium"
 * />
 * ```
 */
export function SummaryResult({ summary, pageCount, length }: SummaryResultProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may not be available in all contexts
    }
  }, [summary]);

  return (
    <div
      className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900"
      role="region"
      aria-label="PDF summary result"
    >
      {/* Header with badges */}
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20 dark:bg-indigo-950 dark:text-indigo-300 dark:ring-indigo-400/30"
          >
            <FileText className="h-3 w-3" aria-hidden="true" />
            {pageCount} {pageCount === 1 ? "page" : "pages"}
          </span>
          <span
            className="inline-flex items-center gap-1.5 rounded-md bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-600/20 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-400/30"
          >
            <AlignLeft className="h-3 w-3" aria-hidden="true" />
            {LENGTH_LABELS[length] || length}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Copied to clipboard" : "Copy summary to clipboard"}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
            copied
              ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
              : "bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          )}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Summary content */}
      <div className="px-5 py-4">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          {summary}
        </p>
      </div>
    </div>
  );
}
