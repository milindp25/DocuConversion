/**
 * Root error boundary for DocuConversion.
 * Catches unhandled rendering errors across the entire app
 * and displays a user-friendly fallback with retry and home links.
 */

"use client";

import Link from "next/link";

/** Props provided by Next.js to error boundary components */
export interface RootErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Root error boundary component.
 * Renders a friendly error state with a "Try again" button
 * and a "Go home" fallback link.
 */
export default function RootError({ error, reset }: RootErrorProps) {
  return (
    <div
      className="flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center px-4 py-20 text-center"
      role="alert"
    >
      <div className="mx-auto mb-6 inline-flex rounded-full bg-red-500/10 p-4 ring-1 ring-red-500/20">
        <svg
          className="h-8 w-8 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-white">Something went wrong</h2>

      <p className="mt-3 max-w-md text-gray-400">
        An unexpected error occurred. Please try again, or return to the home
        page if the problem persists.
        {error.digest && (
          <span className="mt-1 block text-xs text-gray-600">
            Error ID: {error.digest}
          </span>
        )}
      </p>

      <div className="mt-8 flex items-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-950"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-gray-700 px-6 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:border-gray-500 hover:bg-gray-800/50 hover:text-white"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
