/**
 * Sign tools category page.
 * Lists available PDF signing tools with descriptions and links.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { PenTool } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign PDF — Add Electronic Signatures",
  description:
    "Add electronic signatures to any PDF document. Draw, type, or upload your signature. Free, fast, and no account needed.",
};

/** Available signing tools */
const SIGN_TOOLS = [
  { id: "sign-pdf", name: "Sign PDF", description: "Add your electronic signature to any PDF document" },
] as const;

/**
 * Renders the sign tools category page with the available signing tool.
 */
export default function SignPage() {
  return (
    <div>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 inline-flex rounded-lg bg-orange-50 p-3 text-orange-600 dark:bg-orange-950">
          <PenTool className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Sign PDF
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Add electronic signatures to your PDF documents.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SIGN_TOOLS.map((tool) => (
          <Link
            key={tool.id}
            href={`/tools/sign/${tool.id}`}
            className="group rounded-lg border border-gray-200 p-5 transition-all hover:border-orange-300 hover:shadow-sm dark:border-gray-800 dark:hover:border-orange-700"
          >
            <h2 className="font-semibold text-gray-900 group-hover:text-orange-600 dark:text-white">
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
