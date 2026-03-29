/**
 * Edit tools category page.
 * Lists all available PDF editing tools with descriptions and links.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Pencil } from "lucide-react";

export const metadata: Metadata = {
  title: "Edit PDF — Add Text, Watermarks & Page Numbers",
  description:
    "Edit your PDFs online. Add text, watermarks, page numbers, and more. Free, fast, and no account needed.",
};

/** Available editing tools */
const EDIT_TOOLS = [
  { id: "edit-pdf", name: "Edit PDF", description: "Add text, images, shapes, and annotations to your PDF" },
  { id: "add-watermark", name: "Add Watermark", description: "Place text or image watermarks on every page of your PDF" },
  { id: "add-page-numbers", name: "Add Page Numbers", description: "Insert page numbers in customizable positions and formats" },
] as const;

/**
 * Renders the edit tools category page with a grid of available editing tools.
 */
export default function EditPage() {
  return (
    <div>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 inline-flex rounded-lg bg-purple-50 p-3 text-purple-600 dark:bg-purple-950">
          <Pencil className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Edit PDF
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Add text, watermarks, page numbers, and more to your PDFs.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {EDIT_TOOLS.map((tool) => (
          <Link
            key={tool.id}
            href={`/tools/edit/${tool.id}`}
            className="group rounded-lg border border-gray-200 p-5 transition-all hover:border-purple-300 hover:shadow-sm dark:border-gray-800 dark:hover:border-purple-700"
          >
            <h2 className="font-semibold text-gray-900 group-hover:text-purple-600 dark:text-white">
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
