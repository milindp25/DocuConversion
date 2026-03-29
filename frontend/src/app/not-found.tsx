/**
 * Custom 404 page for DocuConversion.
 * Displays a friendly "Page not found" message with gradient styling,
 * a link home, and shortcuts to popular tools.
 */

import Link from "next/link";
import { FileText, ArrowRightLeft, Merge, Sparkles, Shield } from "lucide-react";

/** Popular tools shown as suggestions on the 404 page */
const SUGGESTED_TOOLS = [
  { name: "PDF to Word", href: "/tools/convert/pdf-to-word", icon: ArrowRightLeft, color: "text-blue-400" },
  { name: "Merge PDF", href: "/tools/organize/merge", icon: Merge, color: "text-green-400" },
  { name: "Summarize PDF", href: "/tools/ai/summarize", icon: Sparkles, color: "text-indigo-400" },
  { name: "Protect PDF", href: "/tools/secure/protect", icon: Shield, color: "text-red-400" },
] as const;

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center px-4 py-20 text-center">
      {/* Large 404 with gradient text */}
      <h1
        className="select-none text-[8rem] font-extrabold leading-none tracking-tighter sm:text-[10rem]"
        aria-label="404"
      >
        <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
          404
        </span>
      </h1>

      <h2 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">
        This page doesn&apos;t exist
      </h2>
      <p className="mt-3 max-w-md text-gray-400">
        The page you&apos;re looking for may have been moved, deleted, or
        never existed in the first place.
      </p>

      {/* Go back home button */}
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all duration-200 hover:bg-blue-500 hover:shadow-xl hover:shadow-blue-600/30"
      >
        <FileText className="h-4 w-4" aria-hidden="true" />
        Go back home
      </Link>

      {/* Suggested tools */}
      <div className="mt-14 w-full max-w-lg">
        <p className="mb-5 text-sm font-medium text-gray-500">
          Or try one of these tools:
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SUGGESTED_TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group flex flex-col items-center gap-2 rounded-lg border border-gray-800/50 bg-gray-900/50 px-4 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-700 hover:shadow-lg hover:shadow-blue-500/5"
            >
              <tool.icon
                className={`h-5 w-5 ${tool.color}`}
                aria-hidden="true"
              />
              <span className="text-xs font-medium text-gray-400 group-hover:text-white">
                {tool.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
