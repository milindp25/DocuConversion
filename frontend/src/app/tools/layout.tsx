/**
 * Shared layout for all tool pages under /tools.
 * Provides consistent padding and max-width container.
 */

/** Props for the ToolsLayout component */
export interface ToolsLayoutProps {
  children: React.ReactNode;
}

export default function ToolsLayout({ children }: ToolsLayoutProps) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {children}
    </div>
  );
}
