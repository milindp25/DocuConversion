/**
 * Form components for adding new annotations in the PDF editor.
 * Extracted from AnnotationPanel to keep file sizes manageable.
 * Each form collects type-specific properties and calls onAdd.
 */

"use client";

import React, { useCallback, useState } from "react";

import { Plus } from "lucide-react";

import type { Annotation, ShapeType } from "@/types/editor";
import {
  DEFAULT_TEXT_PROPERTIES,
  DEFAULT_HIGHLIGHT_PROPERTIES,
  DEFAULT_SHAPE_PROPERTIES,
} from "@/types/editor";

/** Shared props for all annotation add forms */
export interface AddFormProps {
  /** Current page number to pre-fill */
  currentPage: number;
  /** Total pages for validation */
  totalPages: number;
  /** Callback when the form submits a new annotation */
  onAdd: (annotation: Annotation) => void;
}

/** Input class string shared across all form inputs */
const INPUT_CLASS =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white";

const SMALL_INPUT_CLASS =
  "w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white";

const LABEL_CLASS =
  "mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300";

const SUBMIT_CLASS =
  "flex w-full items-center justify-center gap-1.5 rounded-md bg-purple-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-1";

/** Generates a unique ID for new annotations */
function generateId(): string {
  return `ann_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/** Form for adding a new text annotation */
export function AddTextForm({ currentPage, totalPages, onAdd }: AddFormProps) {
  const [content, setContent] = useState("");
  const [page, setPage] = useState(currentPage);
  const [x, setX] = useState(0.1);
  const [y, setY] = useState(0.1);
  const [fontSize, setFontSize] = useState(DEFAULT_TEXT_PROPERTIES.fontSize);
  const [color, setColor] = useState(DEFAULT_TEXT_PROPERTIES.color);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!content.trim()) return;
      onAdd({
        id: generateId(),
        type: "text",
        pageNumber: page,
        x,
        y,
        width: 0.3,
        height: 0.05,
        properties: { ...DEFAULT_TEXT_PROPERTIES, content: content.trim(), fontSize, color },
      });
      setContent("");
    },
    [content, page, x, y, fontSize, color, onAdd]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="text-content" className={LABEL_CLASS}>Text content</label>
        <textarea id="text-content" value={content} onChange={(e) => setContent(e.target.value)} rows={2} placeholder="Enter text..." required className={INPUT_CLASS} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="text-page" className={LABEL_CLASS}>Page</label>
          <input id="text-page" type="number" min={1} max={totalPages} value={page} onChange={(e) => setPage(Number(e.target.value))} className={INPUT_CLASS} />
        </div>
        <div>
          <label htmlFor="text-font-size" className={LABEL_CLASS}>Font size</label>
          <input id="text-font-size" type="number" min={6} max={72} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className={INPUT_CLASS} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="text-x" className={LABEL_CLASS}>X position (0-1)</label>
          <input id="text-x" type="number" min={0} max={1} step={0.01} value={x} onChange={(e) => setX(Number(e.target.value))} className={INPUT_CLASS} />
        </div>
        <div>
          <label htmlFor="text-y" className={LABEL_CLASS}>Y position (0-1)</label>
          <input id="text-y" type="number" min={0} max={1} step={0.01} value={y} onChange={(e) => setY(Number(e.target.value))} className={INPUT_CLASS} />
        </div>
      </div>
      <div>
        <label htmlFor="text-color" className={LABEL_CLASS}>Color</label>
        <input id="text-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-full cursor-pointer rounded-md border border-gray-300 dark:border-gray-600" />
      </div>
      <button type="submit" className={SUBMIT_CLASS}>
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        Add text
      </button>
    </form>
  );
}

/** Form for adding a new highlight annotation */
export function AddHighlightForm({ currentPage, totalPages, onAdd }: AddFormProps) {
  const [page, setPage] = useState(currentPage);
  const [x, setX] = useState(0.1);
  const [y, setY] = useState(0.1);
  const [width, setWidth] = useState(0.5);
  const [height, setHeight] = useState(0.03);
  const [color, setColor] = useState(DEFAULT_HIGHLIGHT_PROPERTIES.color);
  const [opacity, setOpacity] = useState(DEFAULT_HIGHLIGHT_PROPERTIES.opacity);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onAdd({
        id: generateId(),
        type: "highlight",
        pageNumber: page,
        x, y, width, height,
        properties: { color, opacity },
      });
    },
    [page, x, y, width, height, color, opacity, onAdd]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="hl-page" className={LABEL_CLASS}>Page</label>
          <input id="hl-page" type="number" min={1} max={totalPages} value={page} onChange={(e) => setPage(Number(e.target.value))} className={INPUT_CLASS} />
        </div>
        <div>
          <label htmlFor="hl-opacity" className={LABEL_CLASS}>Opacity ({Math.round(opacity * 100)}%)</label>
          <input id="hl-opacity" type="range" min={0.1} max={1} step={0.05} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="mt-1.5 w-full" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <div><label htmlFor="hl-x" className={LABEL_CLASS}>X</label><input id="hl-x" type="number" min={0} max={1} step={0.01} value={x} onChange={(e) => setX(Number(e.target.value))} className={SMALL_INPUT_CLASS} /></div>
        <div><label htmlFor="hl-y" className={LABEL_CLASS}>Y</label><input id="hl-y" type="number" min={0} max={1} step={0.01} value={y} onChange={(e) => setY(Number(e.target.value))} className={SMALL_INPUT_CLASS} /></div>
        <div><label htmlFor="hl-w" className={LABEL_CLASS}>W</label><input id="hl-w" type="number" min={0.01} max={1} step={0.01} value={width} onChange={(e) => setWidth(Number(e.target.value))} className={SMALL_INPUT_CLASS} /></div>
        <div><label htmlFor="hl-h" className={LABEL_CLASS}>H</label><input id="hl-h" type="number" min={0.01} max={1} step={0.01} value={height} onChange={(e) => setHeight(Number(e.target.value))} className={SMALL_INPUT_CLASS} /></div>
      </div>
      <div>
        <label htmlFor="hl-color" className={LABEL_CLASS}>Color</label>
        <input id="hl-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-full cursor-pointer rounded-md border border-gray-300 dark:border-gray-600" />
      </div>
      <button type="submit" className={SUBMIT_CLASS}>
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        Add highlight
      </button>
    </form>
  );
}

/** Form for adding a new shape annotation */
export function AddShapeForm({ currentPage, totalPages, onAdd }: AddFormProps) {
  const [page, setPage] = useState(currentPage);
  const [shapeType, setShapeType] = useState<ShapeType>("rectangle");
  const [x, setX] = useState(0.1);
  const [y, setY] = useState(0.1);
  const [width, setWidth] = useState(0.2);
  const [height, setHeight] = useState(0.2);
  const [strokeColor, setStrokeColor] = useState(DEFAULT_SHAPE_PROPERTIES.strokeColor);
  const [fillColor, setFillColor] = useState(DEFAULT_SHAPE_PROPERTIES.fillColor || "#ffffff");
  const [strokeWidth, setStrokeWidth] = useState(DEFAULT_SHAPE_PROPERTIES.strokeWidth);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onAdd({
        id: generateId(),
        type: "shape",
        pageNumber: page,
        x, y, width, height,
        properties: { shapeType, strokeColor, fillColor, strokeWidth },
      });
    },
    [page, shapeType, x, y, width, height, strokeColor, fillColor, strokeWidth, onAdd]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="shape-page" className={LABEL_CLASS}>Page</label>
          <input id="shape-page" type="number" min={1} max={totalPages} value={page} onChange={(e) => setPage(Number(e.target.value))} className={INPUT_CLASS} />
        </div>
        <div>
          <label htmlFor="shape-type" className={LABEL_CLASS}>Shape</label>
          <select id="shape-type" value={shapeType} onChange={(e) => setShapeType(e.target.value as ShapeType)} className={INPUT_CLASS}>
            <option value="rectangle">Rectangle</option>
            <option value="circle">Circle</option>
            <option value="line">Line</option>
            <option value="arrow">Arrow</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <div><label htmlFor="shape-x" className={LABEL_CLASS}>X</label><input id="shape-x" type="number" min={0} max={1} step={0.01} value={x} onChange={(e) => setX(Number(e.target.value))} className={SMALL_INPUT_CLASS} /></div>
        <div><label htmlFor="shape-y" className={LABEL_CLASS}>Y</label><input id="shape-y" type="number" min={0} max={1} step={0.01} value={y} onChange={(e) => setY(Number(e.target.value))} className={SMALL_INPUT_CLASS} /></div>
        <div><label htmlFor="shape-w" className={LABEL_CLASS}>W</label><input id="shape-w" type="number" min={0.01} max={1} step={0.01} value={width} onChange={(e) => setWidth(Number(e.target.value))} className={SMALL_INPUT_CLASS} /></div>
        <div><label htmlFor="shape-h" className={LABEL_CLASS}>H</label><input id="shape-h" type="number" min={0.01} max={1} step={0.01} value={height} onChange={(e) => setHeight(Number(e.target.value))} className={SMALL_INPUT_CLASS} /></div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="shape-stroke" className={LABEL_CLASS}>Stroke</label>
          <input id="shape-stroke" type="color" value={strokeColor} onChange={(e) => setStrokeColor(e.target.value)} className="h-8 w-full cursor-pointer rounded-md border border-gray-300 dark:border-gray-600" />
        </div>
        <div>
          <label htmlFor="shape-fill" className={LABEL_CLASS}>Fill</label>
          <input id="shape-fill" type="color" value={fillColor} onChange={(e) => setFillColor(e.target.value)} className="h-8 w-full cursor-pointer rounded-md border border-gray-300 dark:border-gray-600" />
        </div>
      </div>
      <div>
        <label htmlFor="shape-stroke-width" className={LABEL_CLASS}>Stroke width ({strokeWidth}px)</label>
        <input id="shape-stroke-width" type="range" min={1} max={10} value={strokeWidth} onChange={(e) => setStrokeWidth(Number(e.target.value))} className="w-full" />
      </div>
      <button type="submit" className={SUBMIT_CLASS}>
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        Add shape
      </button>
    </form>
  );
}
