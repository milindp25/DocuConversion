/**
 * Loading state for tool pages.
 * Displays a skeleton UI mimicking the tool page layout:
 * icon placeholder, title bar, and upload zone rectangle.
 */

export default function ToolsLoading() {
  return (
    <div
      className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8"
      role="status"
      aria-label="Loading tool"
    >
      <div className="flex flex-col items-center space-y-6">
        {/* Icon placeholder */}
        <div className="h-12 w-12 animate-pulse rounded-lg bg-gray-800" />

        {/* Title bar placeholder */}
        <div className="flex w-full max-w-xs flex-col items-center gap-2">
          <div className="h-7 w-48 animate-pulse rounded bg-gray-800" />
          <div className="h-4 w-64 animate-pulse rounded bg-gray-800/60" />
        </div>

        {/* Upload zone placeholder */}
        <div className="mt-4 w-full">
          <div className="h-48 w-full animate-pulse rounded-xl border-2 border-dashed border-gray-800 bg-gray-900/50" />
        </div>

        {/* Action area placeholder */}
        <div className="h-10 w-40 animate-pulse rounded-lg bg-gray-800/40" />
      </div>
    </div>
  );
}
