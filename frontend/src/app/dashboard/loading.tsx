/**
 * Loading state for dashboard pages.
 * Displays a skeleton UI with a sidebar placeholder and content area.
 */

export default function DashboardLoading() {
  return (
    <div
      className="flex min-h-[calc(100vh-4rem)]"
      role="status"
      aria-label="Loading dashboard"
    >
      {/* Sidebar placeholder */}
      <aside className="hidden w-56 border-r border-gray-800 bg-gray-950 p-4 md:block">
        <div className="space-y-3">
          <div className="h-5 w-32 animate-pulse rounded bg-gray-800" />
          <div className="h-4 w-24 animate-pulse rounded bg-gray-800/60" />
          <div className="h-4 w-28 animate-pulse rounded bg-gray-800/60" />
          <div className="h-4 w-20 animate-pulse rounded bg-gray-800/60" />
          <div className="h-4 w-26 animate-pulse rounded bg-gray-800/60" />
        </div>
      </aside>

      {/* Content area placeholder */}
      <div className="flex-1 p-6 sm:p-8">
        {/* Header row */}
        <div className="mb-8 flex items-center justify-between">
          <div className="h-7 w-48 animate-pulse rounded bg-gray-800" />
          <div className="h-9 w-28 animate-pulse rounded-lg bg-gray-800" />
        </div>

        {/* Stats cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-gray-800 bg-gray-900/50"
            />
          ))}
        </div>

        {/* Table rows */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-lg bg-gray-900/30"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
