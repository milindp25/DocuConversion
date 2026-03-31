/**
 * Main editing canvas for the PDF editor.
 * Displays the uploaded PDF file information and a visual preview area.
 * In Phase 1, this shows the filename/page info and a list of annotations
 * placed on the current page. Full canvas-based editing is planned for Phase 1.5.
 */

"use client";

import React from "react";

import { FileText, Layers, Loader2, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/format";
import type { Annotation } from "@/types/editor";

/** Props for the EditorCanvas component */
export interface EditorCanvasProps {
  /** The uploaded PDF file (null if no file loaded) */
  file: File | null;
  /** Object URL for the file (for potential preview use) */
  fileUrl: string | null;
  /** Annotations for the currently displayed page */
  annotations: Annotation[];
  /** Currently selected annotation ID */
  selectedAnnotation: string | null;
  /** Callback when an annotation is clicked for selection */
  onAnnotationSelect: (id: string | null) => void;
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Current zoom level (percentage) */
  zoom: number;
  /** URL for the rendered preview image of the current page */
  previewImageUrl?: string | null;
  /** Whether the preview image is currently loading */
  isLoadingPreview?: boolean;
  /** Error message if preview loading failed */
  previewError?: string | null;
  /** Callback to navigate to a different page (fetches new preview) */
  onPageChange?: (page: number) => void;
}

/**
 * Returns a human-readable label for an annotation based on its type.
 */
function getAnnotationLabel(annotation: Annotation): string {
  switch (annotation.type) {
    case "text": {
      const props = annotation.properties as { content?: string };
      const preview = props.content
        ? props.content.substring(0, 40) + (props.content.length > 40 ? "..." : "")
        : "Empty text";
      return `Text: "${preview}"`;
    }
    case "highlight":
      return "Highlight";
    case "shape": {
      const shapeProps = annotation.properties as { shapeType?: string };
      return `Shape: ${shapeProps.shapeType ?? "unknown"}`;
    }
    case "image":
      return "Image";
    case "freehand":
      return "Freehand drawing";
    default:
      return "Annotation";
  }
}

/**
 * EditorCanvas displays the PDF preview area and annotation overlays.
 * In Phase 1, it shows file metadata and lists annotations for the
 * current page. Clicking an annotation selects it for editing in the
 * AnnotationPanel.
 *
 * @example
 * ```tsx
 * <EditorCanvas
 *   file={file}
 *   fileUrl={fileUrl}
 *   annotations={pageAnnotations}
 *   selectedAnnotation={selectedId}
 *   onAnnotationSelect={selectAnnotation}
 *   currentPage={1}
 *   totalPages={5}
 *   zoom={100}
 * />
 * ```
 */
export function EditorCanvas({
  file,
  fileUrl,
  annotations,
  selectedAnnotation,
  onAnnotationSelect,
  currentPage,
  totalPages,
  zoom,
  previewImageUrl,
  isLoadingPreview,
  previewError,
  onPageChange,
}: EditorCanvasProps) {
  /** Filter annotations for the current page */
  const pageAnnotations = annotations.filter(
    (a) => a.pageNumber === currentPage
  );

  if (!file) {
    return (
      <div className="flex h-96 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
        <div className="text-center">
          <FileText
            className="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600"
            aria-hidden="true"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upload a PDF to start editing
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* PDF file info header */}
      <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950">
          <FileText
            className="h-5 w-5 text-purple-600 dark:text-purple-400"
            aria-hidden="true"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
            {file.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatFileSize(file.size)} &middot; {totalPages}{" "}
            {totalPages === 1 ? "page" : "pages"} &middot; Viewing page{" "}
            {currentPage} at {zoom}%
          </p>
        </div>
      </div>

      {/* PDF preview area */}
      <div
        className="relative flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-950"
        role="img"
        aria-label={`PDF preview: ${file.name}, page ${currentPage} of ${totalPages}`}
      >
        {/* Loading state */}
        {isLoadingPreview && (
          <div className="flex flex-col items-center gap-3 py-12">
            <Loader2
              className="h-8 w-8 animate-spin text-purple-500"
              aria-hidden="true"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading PDF preview...
            </p>
          </div>
        )}

        {/* Preview image or enhanced fallback */}
        {!isLoadingPreview && (
          <div
            className="flex flex-col items-center justify-center py-4"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "center center",
            }}
          >
            {previewImageUrl ? (
              <img
                src={previewImageUrl}
                alt={`Page ${currentPage} of ${file.name}`}
                className="max-h-[560px] rounded border border-gray-200 shadow-md dark:border-gray-600"
                draggable={false}
              />
            ) : (
              <div className="flex h-[500px] w-[360px] flex-col items-center justify-center rounded border border-gray-200 bg-white shadow-md dark:border-gray-600 dark:bg-gray-900">
                <FileText
                  className="mb-4 h-20 w-20 text-purple-200 dark:text-purple-900"
                  aria-hidden="true"
                />
                <p className="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {file.name}
                </p>
                <p className="mb-3 text-xs text-gray-400 dark:text-gray-500">
                  PDF loaded &middot; {totalPages}{" "}
                  {totalPages === 1 ? "page" : "pages"}
                </p>
                {previewError && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-500">
                    <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Preview unavailable</span>
                  </div>
                )}
                <p className="mt-2 max-w-[260px] text-center text-xs text-gray-400 dark:text-gray-500">
                  Add annotations using the panel on the right. They will be
                  applied to the actual PDF on download.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Page navigation */}
        {!isLoadingPreview && totalPages > 1 && (
          <div className="flex items-center gap-3 pb-4">
            <button
              type="button"
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage <= 1}
              aria-label="Previous page"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage >= totalPages}
              aria-label="Next page"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Annotations on this page */}
      {pageAnnotations.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-2 flex items-center gap-2">
            <Layers
              className="h-4 w-4 text-purple-500"
              aria-hidden="true"
            />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Annotations on page {currentPage} ({pageAnnotations.length})
            </h3>
          </div>

          <ul className="space-y-1" role="listbox" aria-label="Page annotations">
            {pageAnnotations.map((annotation) => (
              <li key={annotation.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selectedAnnotation === annotation.id}
                  onClick={() => onAnnotationSelect(annotation.id)}
                  className={cn(
                    "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500",
                    selectedAnnotation === annotation.id
                      ? "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                  )}
                >
                  <span className="font-medium">
                    {getAnnotationLabel(annotation)}
                  </span>
                  <span className="ml-2 text-xs text-gray-400">
                    ({Math.round(annotation.x * 100)}%, {Math.round(annotation.y * 100)}%)
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
