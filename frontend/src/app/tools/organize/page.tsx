/**
 * Organize tools category page.
 * Lists all available PDF organization tools with descriptions and links.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { FolderOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Organize PDF — Merge, Split, Compress & More",
  description:
    "Organize your PDFs. Merge, split, compress, rotate, and reorder pages. Free, fast, and no account needed.",
};

/** Available organization tools */
const ORGANIZE_TOOLS = [
  { id: "merge", name: "Merge PDF", description: "Combine multiple PDF files into a single document" },
  { id: "split", name: "Split PDF", description: "Separate a PDF into individual pages or custom ranges" },
  { id: "compress", name: "Compress PDF", description: "Reduce PDF file size while preserving quality" },
  { id: "rotate", name: "Rotate PDF", description: "Rotate PDF pages to any orientation" },
  { id: "reorder", name: "Reorder Pages", description: "Rearrange PDF pages in any order with drag-and-drop" },
] as const;

/**
 * Renders the organize tools category page with a grid of available organization tools.
 */
export default function OrganizePage() {
  return (
    <div>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 inline-flex rounded-lg bg-green-50 p-3 text-green-600 dark:bg-green-950">
          <FolderOpen className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Organize PDF
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Merge, split, compress, rotate, and reorder your PDF pages.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {ORGANIZE_TOOLS.map((tool) => (
          <Link
            key={tool.id}
            href={`/tools/organize/${tool.id}`}
            className="group rounded-lg border border-gray-200 p-5 transition-all hover:border-green-300 hover:shadow-sm dark:border-gray-800 dark:hover:border-green-700"
          >
            <h2 className="font-semibold text-gray-900 group-hover:text-green-600 dark:text-white">
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
