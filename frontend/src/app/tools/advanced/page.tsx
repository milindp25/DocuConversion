/**
 * Advanced tools category page.
 * Lists advanced PDF tools like comparison and flattening.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Wrench } from "lucide-react";

export const metadata: Metadata = {
  title: "Advanced PDF Tools — Compare & Flatten",
  description:
    "Advanced PDF tools: compare two PDFs side by side, flatten PDF forms and annotations. Free and fast.",
};

/** Available advanced tools */
const ADVANCED_TOOLS = [
  { id: "compare", name: "Compare PDFs", description: "Compare two PDF documents and see the differences highlighted" },
  { id: "flatten", name: "Flatten PDF", description: "Flatten PDF form fields and annotations into the document" },
] as const;

/**
 * Renders the advanced tools category page with a grid of available tools.
 */
export default function AdvancedToolsPage() {
  return (
    <div>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 inline-flex rounded-lg bg-amber-50 p-3 text-amber-600 dark:bg-amber-950">
          <Wrench className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Advanced PDF Tools
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Compare, flatten, and perform advanced operations on your PDFs.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {ADVANCED_TOOLS.map((tool) => (
          <Link
            key={tool.id}
            href={`/tools/advanced/${tool.id}`}
            className="group rounded-lg border border-gray-200 p-5 transition-all hover:border-amber-300 hover:shadow-sm dark:border-gray-800 dark:hover:border-amber-700"
          >
            <h2 className="font-semibold text-gray-900 group-hover:text-amber-600 dark:text-white">
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
