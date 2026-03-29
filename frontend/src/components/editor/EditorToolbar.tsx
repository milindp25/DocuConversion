/**
 * Horizontal toolbar for the PDF editor.
 * Provides tool selection (select, text, highlight, shapes),
 * undo/redo, zoom controls, page navigation, and a save button.
 */

"use client";

import React from "react";

import {
  MousePointer2,
  Type,
  Highlighter,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { AnnotationType } from "@/types/editor";

/** Props for the EditorToolbar component */
export interface EditorToolbarProps {
  /** Currently active tool */
  activeTool: AnnotationType | "select" | null;
  /** Callback when the user selects a different tool */
  onToolChange: (tool: AnnotationType | "select") => void;
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
  /** Callback to undo the last action */
  onUndo: () => void;
  /** Callback to redo the last undone action */
  onRedo: () => void;
  /** Current zoom level as a percentage */
  zoom: number;
  /** Callback to change the zoom level */
  onZoomChange: (zoom: number) => void;
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Callback to navigate to a specific page */
  onPageChange: (page: number) => void;
  /** Callback to save/download the edited PDF */
  onSave: () => void;
  /** Whether a save operation is in progress */
  isSaving: boolean;
}

/** Tool definition for rendering toolbar buttons */
interface ToolDefinition {
  id: AnnotationType | "select";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

/** Available tools in the toolbar, in display order */
const TOOLS: ToolDefinition[] = [
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "text", label: "Text", icon: Type },
  { id: "highlight", label: "Highlight", icon: Highlighter },
  { id: "shape", label: "Rectangle", icon: Square },
];

/** Shape sub-tools for the shape dropdown */
const SHAPE_TOOLS: ToolDefinition[] = [
  { id: "shape", label: "Rectangle", icon: Square },
  { id: "shape", label: "Circle", icon: Circle },
  { id: "shape", label: "Line", icon: Minus },
  { id: "shape", label: "Arrow", icon: ArrowRight },
];

/** Zoom preset levels */
const ZOOM_PRESETS = [25, 50, 75, 100, 125, 150, 200, 300, 400] as const;

/**
 * Renders a single toolbar icon button with tooltip and active state.
 */
function ToolbarButton({
  label,
  icon: Icon,
  isActive = false,
  disabled = false,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={isActive}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-1",
        isActive
          ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
          : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800",
        disabled && "pointer-events-none opacity-40"
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

/**
 * A vertical divider used to separate groups of toolbar buttons.
 */
function ToolbarDivider() {
  return (
    <div
      className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-700"
      role="separator"
      aria-orientation="vertical"
    />
  );
}

/**
 * EditorToolbar renders the horizontal toolbar at the top of the PDF editor.
 * Contains tool selection, undo/redo, zoom controls, page navigation, and save.
 *
 * @example
 * ```tsx
 * <EditorToolbar
 *   activeTool="select"
 *   onToolChange={setActiveTool}
 *   canUndo={canUndo}
 *   canRedo={canRedo}
 *   onUndo={undo}
 *   onRedo={redo}
 *   zoom={100}
 *   onZoomChange={setZoom}
 *   currentPage={1}
 *   totalPages={5}
 *   onPageChange={setPage}
 *   onSave={handleSave}
 *   isSaving={false}
 * />
 * ```
 */
export function EditorToolbar({
  activeTool,
  onToolChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomChange,
  currentPage,
  totalPages,
  onPageChange,
  onSave,
  isSaving,
}: EditorToolbarProps) {
  return (
    <div
      className="flex flex-wrap items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 shadow-sm dark:border-gray-700 dark:bg-gray-900"
      role="toolbar"
      aria-label="PDF editor tools"
    >
      {/* Tool selection group */}
      <div className="flex items-center gap-0.5" role="group" aria-label="Drawing tools">
        {TOOLS.map((tool) => (
          <ToolbarButton
            key={tool.id + tool.label}
            label={tool.label}
            icon={tool.icon}
            isActive={activeTool === tool.id}
            onClick={() => onToolChange(tool.id)}
          />
        ))}
        {/* Additional shape sub-tools (circle, line, arrow) */}
        {SHAPE_TOOLS.slice(1).map((tool) => (
          <ToolbarButton
            key={tool.label}
            label={tool.label}
            icon={tool.icon}
            isActive={false}
            onClick={() => onToolChange(tool.id)}
          />
        ))}
      </div>

      <ToolbarDivider />

      {/* Undo / Redo group */}
      <div className="flex items-center gap-0.5" role="group" aria-label="History">
        <ToolbarButton
          label="Undo"
          icon={Undo2}
          disabled={!canUndo}
          onClick={onUndo}
        />
        <ToolbarButton
          label="Redo"
          icon={Redo2}
          disabled={!canRedo}
          onClick={onRedo}
        />
      </div>

      <ToolbarDivider />

      {/* Zoom controls */}
      <div className="flex items-center gap-0.5" role="group" aria-label="Zoom">
        <ToolbarButton
          label="Zoom out"
          icon={ZoomOut}
          disabled={zoom <= ZOOM_PRESETS[0]}
          onClick={() => {
            const prev = [...ZOOM_PRESETS].reverse().find((z) => z < zoom);
            onZoomChange(prev ?? ZOOM_PRESETS[0]);
          }}
        />
        <span
          className="min-w-[3.5rem] text-center text-xs font-medium text-gray-600 dark:text-gray-400"
          aria-live="polite"
          aria-label={`Zoom level: ${zoom}%`}
        >
          {zoom}%
        </span>
        <ToolbarButton
          label="Zoom in"
          icon={ZoomIn}
          disabled={zoom >= ZOOM_PRESETS[ZOOM_PRESETS.length - 1]}
          onClick={() => {
            const next = ZOOM_PRESETS.find((z) => z > zoom);
            onZoomChange(next ?? ZOOM_PRESETS[ZOOM_PRESETS.length - 1]);
          }}
        />
      </div>

      <ToolbarDivider />

      {/* Page navigation */}
      <div className="flex items-center gap-0.5" role="group" aria-label="Page navigation">
        <ToolbarButton
          label="Previous page"
          icon={ChevronLeft}
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        />
        <span
          className="min-w-[5rem] text-center text-xs font-medium text-gray-600 dark:text-gray-400"
          aria-live="polite"
        >
          Page {currentPage} of {totalPages}
        </span>
        <ToolbarButton
          label="Next page"
          icon={ChevronRight}
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        />
      </div>

      {/* Spacer to push save button to the right */}
      <div className="flex-1" />

      {/* Save / Download button */}
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        aria-label={isSaving ? "Saving changes" : "Download edited PDF"}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-1",
          "bg-purple-600 text-white hover:bg-purple-700",
          isSaving && "pointer-events-none opacity-70"
        )}
      >
        {isSaving ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {isSaving ? "Saving..." : "Download"}
      </button>
    </div>
  );
}
