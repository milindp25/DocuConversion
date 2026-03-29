/**
 * Secure tools category page.
 * Lists all available PDF security tools with descriptions and links.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Secure PDF — Protect, Unlock & Redact",
  description:
    "Secure your PDFs. Add password protection, unlock restricted PDFs, and redact sensitive content. Free, fast, and no account needed.",
};

/** Available security tools */
const SECURE_TOOLS = [
  { id: "protect", name: "Protect PDF", description: "Add password protection and encryption to your PDF files" },
  { id: "unlock", name: "Unlock PDF", description: "Remove password restrictions from protected PDF documents" },
  { id: "redact", name: "Redact PDF", description: "Permanently remove sensitive content from your PDF" },
] as const;

/**
 * Renders the secure tools category page with a grid of available security tools.
 */
export default function SecurePage() {
  return (
    <div>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 inline-flex rounded-lg bg-red-50 p-3 text-red-600 dark:bg-red-950">
          <Shield className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Secure PDF
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Protect, unlock, and redact sensitive content in your PDFs.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SECURE_TOOLS.map((tool) => (
          <Link
            key={tool.id}
            href={`/tools/secure/${tool.id}`}
            className="group rounded-lg border border-gray-200 p-5 transition-all hover:border-red-300 hover:shadow-sm dark:border-gray-800 dark:hover:border-red-700"
          >
            <h2 className="font-semibold text-gray-900 group-hover:text-red-600 dark:text-white">
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
