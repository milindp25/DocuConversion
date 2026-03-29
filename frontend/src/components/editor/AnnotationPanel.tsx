/**
 * Side panel for managing annotations in the PDF editor.
 * Shows collapsible "Add" forms for text/highlight/shape annotations
 * and a scrollable list of existing annotations with selection and deletion.
 */

"use client";

import React, { useCallback, useState } from "react";

import {
  Trash2,
  Type,
  Highlighter,
  Square,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { Annotation, TextProperties } from "@/types/editor";
import { AddTextForm, AddHighlightForm, AddShapeForm } from "./AnnotationForms";

/** Props for the AnnotationPanel component */
export interface AnnotationPanelProps {
  /** All annotations in the document */
  annotations: Annotation[];
  /** ID of the currently selected annotation (or null) */
  selectedAnnotation: string | null;
  /** Current page number for new annotations */
  currentPage: number;
  /** Total pages in the document */
  totalPages: number;
  /** Callback to add a new annotation */
  onAddAnnotation: (annotation: Annotation) => void;
  /** Callback to update an existing annotation */
  onUpdateAnnotation: (id: string, changes: Partial<Annotation>) => void;
  /** Callback to remove an annotation */
  onRemoveAnnotation: (id: string) => void;
  /** Callback to select an annotation */
  onSelectAnnotation: (id: string | null) => void;
}

/** Label and icon for each supported annotation type */
const ANNOTATION_TYPE_INFO: Record<
  "text" | "highlight" | "shape",
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  text: { label: "Text", icon: Type },
  highlight: { label: "Highlight", icon: Highlighter },
  shape: { label: "Shape", icon: Square },
};

/**
 * AnnotationPanel provides the right-side panel for adding and managing
 * annotations. Includes collapsible form sections for each annotation type
 * and a list of all annotations with selection and deletion.
 *
 * @example
 * ```tsx
 * <AnnotationPanel
 *   annotations={state.annotations}
 *   selectedAnnotation={state.selectedAnnotation}
 *   currentPage={state.currentPage}
 *   totalPages={state.totalPages}
 *   onAddAnnotation={addAnnotation}
 *   onUpdateAnnotation={updateAnnotation}
 *   onRemoveAnnotation={removeAnnotation}
 *   onSelectAnnotation={selectAnnotation}
 * />
 * ```
 */
export function AnnotationPanel({
  annotations,
  selectedAnnotation,
  currentPage,
  totalPages,
  onAddAnnotation,
  onUpdateAnnotation: _onUpdateAnnotation,
  onRemoveAnnotation,
  onSelectAnnotation,
}: AnnotationPanelProps) {
  const [expandedForm, setExpandedForm] = useState<"text" | "highlight" | "shape" | null>(null);

  const toggleForm = useCallback(
    (form: "text" | "highlight" | "shape") => {
      setExpandedForm((prev) => (prev === form ? null : form));
    },
    []
  );

  return (
    <aside className="flex w-full flex-col gap-4 lg:w-72" aria-label="Annotation panel">
      {/* Add annotation forms */}
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <h2 className="border-b border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-900 dark:border-gray-700 dark:text-white">
          Add annotation
        </h2>

        {(["text", "highlight", "shape"] as const).map((type) => {
          const info = ANNOTATION_TYPE_INFO[type];
          const Icon = info.icon;
          const isExpanded = expandedForm === type;

          return (
            <div key={type} className="border-b border-gray-100 last:border-b-0 dark:border-gray-800">
              <button
                type="button"
                onClick={() => toggleForm(type)}
                aria-expanded={isExpanded}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <Icon className="h-4 w-4 text-purple-500" aria-hidden="true" />
                <span className="flex-1">{info.label}</span>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                )}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4">
                  {type === "text" && <AddTextForm currentPage={currentPage} totalPages={totalPages} onAdd={onAddAnnotation} />}
                  {type === "highlight" && <AddHighlightForm currentPage={currentPage} totalPages={totalPages} onAdd={onAddAnnotation} />}
                  {type === "shape" && <AddShapeForm currentPage={currentPage} totalPages={totalPages} onAdd={onAddAnnotation} />}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Annotation list */}
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <h2 className="border-b border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-900 dark:border-gray-700 dark:text-white">
          Annotations ({annotations.length})
        </h2>

        {annotations.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-gray-400 dark:text-gray-500">
            No annotations yet. Use the forms above to add text, highlights, or shapes.
          </p>
        ) : (
          <ul className="max-h-64 overflow-y-auto" role="listbox" aria-label="All annotations">
            {annotations.map((annotation) => {
              const typeInfo = ANNOTATION_TYPE_INFO[annotation.type as "text" | "highlight" | "shape"]
                ?? { label: annotation.type, icon: Square };
              const Icon = typeInfo.icon;
              const isSelected = selectedAnnotation === annotation.id;

              let label = typeInfo.label;
              if (annotation.type === "text") {
                const textProps = annotation.properties as TextProperties;
                const preview = textProps.content.substring(0, 20);
                label = preview + (textProps.content.length > 20 ? "..." : "");
              }

              return (
                <li
                  key={annotation.id}
                  className={cn(
                    "flex items-center gap-2 border-b border-gray-100 px-4 py-2 last:border-b-0 dark:border-gray-800",
                    isSelected && "bg-purple-50 dark:bg-purple-950"
                  )}
                >
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => onSelectAnnotation(annotation.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                  >
                    <Icon className="h-3.5 w-3.5 flex-shrink-0 text-purple-400" aria-hidden="true" />
                    <span className="truncate text-xs text-gray-700 dark:text-gray-300">{label}</span>
                    <span className="flex-shrink-0 text-[10px] text-gray-400">p.{annotation.pageNumber}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveAnnotation(annotation.id)}
                    aria-label={`Delete annotation: ${label}`}
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  >
                    <Trash2 className="h-3 w-3" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
