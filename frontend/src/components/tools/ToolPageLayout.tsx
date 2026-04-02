/**
 * Consistent wrapper layout for individual tool pages.
 * Provides a uniform structure with category-colored icon,
 * title, description, and a slot for tool-specific content.
 * Used by all 20+ tool pages (e.g., /tools/convert/pdf-to-word).
 */

import React from "react";

import { TOOL_CATEGORY_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ToolCategory } from "@/types";

/** Props for the ToolPageLayout component */
export interface ToolPageLayoutProps {
  /** Tool title (e.g., "PDF to Word") */
  title: string;
  /** Tool description */
  description: string;
  /** Tool category for color coding */
  category: ToolCategory;
  /** Icon component from lucide-react */
  icon: React.ComponentType<{ className?: string }>;
  /** The tool-specific content (upload zone, options, results) */
  children: React.ReactNode;
  /**
   * Use a wider container (max-w-6xl) for editor-style tools
   * that need horizontal space for a canvas + side panel.
   * Default tools use max-w-2xl.
   */
  wide?: boolean;
  /** Optional SEO supporting content rendered below the tool */
  supportingContent?: React.ReactNode;
}

/**
 * ToolPageLayout wraps every tool page with a consistent header
 * (category-colored icon, title, description) and renders the
 * tool-specific children below.
 *
 * @example
 * ```tsx
 * <ToolPageLayout
 *   title="PDF to Word"
 *   description="Convert your PDF documents to editable Word files."
 *   category="convert"
 *   icon={FileText}
 * >
 *   <FileUploader ... />
 * </ToolPageLayout>
 * ```
 */
export function ToolPageLayout({
  title,
  description,
  category,
  icon: Icon,
  children,
  wide = false,
  supportingContent,
}: ToolPageLayoutProps) {
  const colors = TOOL_CATEGORY_COLORS[category];

  return (
    <main className={cn("mx-auto px-4 py-16 sm:px-6 lg:px-8", wide ? "max-w-6xl" : "max-w-2xl")}>
      {/* Tool header */}
      <div className="mb-10 text-center">
        <div
          className={cn(
            "mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg",
            colors.bg
          )}
          style={{
            boxShadow: `0 8px 24px -4px var(--tw-shadow-color, rgba(0,0,0,0.1))`,
          }}
        >
          <div
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-2xl",
              colors.bg
            )}
            style={{
              filter: "drop-shadow(0 0 8px currentColor)",
            }}
          >
            <Icon className={cn("h-8 w-8", colors.icon)} aria-hidden="true" />
          </div>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          {title}
        </h1>

        <p className="mt-3 text-base text-gray-600 dark:text-gray-400">
          {description}
        </p>
      </div>

      {/* Tool content */}
      <div className="space-y-8">{children}</div>

      {/* Supporting SEO content */}
      {supportingContent && (
        <section className="mt-16 border-t border-gray-200 pt-12 dark:border-gray-800">
          <div className="prose prose-gray max-w-none dark:prose-invert prose-headings:text-lg prose-headings:font-semibold prose-p:text-sm prose-p:leading-relaxed prose-p:text-gray-600 dark:prose-p:text-gray-400">
            {supportingContent}
          </div>
        </section>
      )}
    </main>
  );
}
