/**
 * Error boundary for tool pages.
 * Catches rendering errors within the /tools route tree and displays
 * a user-friendly fallback UI with a retry action.
 */

"use client";

/** Props provided by Next.js to error boundary components */
export interface ToolsErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary component for the /tools route segment.
 * Renders a friendly error state with a "Try again" button
 * that re-attempts rendering the failed component tree.
 *
 * @param props - Error details and reset callback from Next.js
 */
export default function ToolsError({ error, reset }: ToolsErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
      <div className="mx-auto mb-6 inline-flex rounded-full bg-red-50 p-4 text-red-500 dark:bg-red-950">
        <svg
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        This tool encountered an error
      </h2>

      <p className="mt-3 max-w-md text-gray-600 dark:text-gray-400">
        We ran into an unexpected error while processing your request.
        Try uploading a different file, or come back later if the issue
        persists.
        {error.digest && (
          <span className="mt-1 block text-xs text-gray-400">
            Error ID: {error.digest}
          </span>
        )}
      </p>

      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={reset}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-950"
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded-lg border border-gray-700 px-6 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:border-gray-500 hover:bg-gray-800/50 hover:text-white"
        >
          Go home
        </a>
      </div>
    </div>
  );
}
