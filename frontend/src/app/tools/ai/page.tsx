/**
 * AI tools category page.
 * Lists all available AI-powered PDF tools with descriptions and links.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "AI PDF Tools — Summarize, Chat, Extract & OCR",
  description:
    "AI-powered PDF tools: summarize documents, chat with your PDF, extract data and tables, and OCR scanned documents. Free and fast.",
};

/** Available AI tools */
const AI_TOOLS = [
  { id: "summarize", name: "Summarize PDF", description: "Get an AI-generated summary of any PDF document" },
  { id: "chat", name: "Chat with PDF", description: "Ask questions about your PDF and get instant answers" },
  { id: "extract", name: "Smart Extraction", description: "Extract tables, key-value pairs, and named entities from PDFs" },
  { id: "ocr", name: "OCR", description: "Extract text from scanned PDFs and images using optical character recognition" },
] as const;

/**
 * Renders the AI tools category page with a grid of available AI-powered tools.
 */
export default function AiToolsPage() {
  return (
    <div>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 inline-flex rounded-lg bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-950">
          <Sparkles className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          AI PDF Tools
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          AI-powered tools to summarize, chat, extract data, and OCR your PDFs.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {AI_TOOLS.map((tool) => (
          <Link
            key={tool.id}
            href={`/tools/ai/${tool.id}`}
            className="group rounded-lg border border-gray-200 p-5 transition-all hover:border-indigo-300 hover:shadow-sm dark:border-gray-800 dark:hover:border-indigo-700"
          >
            <h2 className="font-semibold text-gray-900 group-hover:text-indigo-600 dark:text-white">
              {tool.name}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {tool.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
