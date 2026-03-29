/**
 * Root loading state for DocuConversion.
 * Shown by Next.js while the root page or layout is loading.
 * Displays a centered spinner with "Loading..." text.
 */

export default function RootLoading() {
  return (
    <div
      className="flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center"
      role="status"
      aria-label="Loading page"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-700 border-t-blue-500" />
      <p className="mt-4 text-sm text-gray-500">Loading...</p>
    </div>
  );
}
