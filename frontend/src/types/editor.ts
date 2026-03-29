/**
 * Editor-specific types for the DocuConversion PDF editor.
 * Defines annotation types, properties, and the full editor state shape
 * used by the useEditorState hook and editor components.
 */

/** Types of annotations that can be added to a PDF */
export type AnnotationType = "text" | "highlight" | "shape" | "image" | "freehand";

/** A single annotation on a PDF page */
export interface Annotation {
  /** Unique identifier for this annotation */
  id: string;
  /** The type of annotation */
  type: AnnotationType;
  /** Which page (1-indexed) this annotation belongs to */
  pageNumber: number;
  /** X position relative to the page (0-1 normalized coordinate) */
  x: number;
  /** Y position relative to the page (0-1 normalized coordinate) */
  y: number;
  /** Width relative to the page (0-1 normalized) */
  width: number;
  /** Height relative to the page (0-1 normalized) */
  height: number;
  /** Type-specific properties for this annotation */
  properties: TextProperties | HighlightProperties | ShapeProperties;
}

/** Properties specific to text annotations */
export interface TextProperties {
  /** The text content to render */
  content: string;
  /** Font size in points */
  fontSize: number;
  /** Font family name */
  fontFamily: string;
  /** CSS color string */
  color: string;
  /** Whether to render in bold */
  bold: boolean;
  /** Whether to render in italic */
  italic: boolean;
}

/** Properties specific to highlight annotations */
export interface HighlightProperties {
  /** CSS color string for the highlight */
  color: string;
  /** Opacity value from 0 to 1 */
  opacity: number;
}

/** Available shape types for shape annotations */
export type ShapeType = "rectangle" | "circle" | "line" | "arrow";

/** Properties specific to shape annotations */
export interface ShapeProperties {
  /** The geometric shape to draw */
  shapeType: ShapeType;
  /** CSS color for the stroke/outline */
  strokeColor: string;
  /** CSS color for the fill (empty string for no fill) */
  fillColor: string;
  /** Stroke width in points */
  strokeWidth: number;
}

/** The tool currently active in the editor */
export type ActiveTool = AnnotationType | "select" | null;

/** Full state of the PDF editor */
export interface EditorState {
  /** The uploaded PDF file */
  file: File | null;
  /** Object URL for the uploaded file (for display) */
  fileUrl: string | null;
  /** All annotations added to the document */
  annotations: Annotation[];
  /** ID of the currently selected annotation, or null */
  selectedAnnotation: string | null;
  /** The currently active tool */
  activeTool: ActiveTool;
  /** Current page being viewed (1-indexed) */
  currentPage: number;
  /** Total number of pages in the document */
  totalPages: number;
  /** Current zoom level as a percentage (100 = 100%) */
  zoom: number;
}

/** Default text properties for new text annotations */
export const DEFAULT_TEXT_PROPERTIES: TextProperties = {
  content: "",
  fontSize: 14,
  fontFamily: "Helvetica",
  color: "#000000",
  bold: false,
  italic: false,
};

/** Default highlight properties for new highlight annotations */
export const DEFAULT_HIGHLIGHT_PROPERTIES: HighlightProperties = {
  color: "#FFFF00",
  opacity: 0.4,
};

/** Default shape properties for new shape annotations */
export const DEFAULT_SHAPE_PROPERTIES: ShapeProperties = {
  shapeType: "rectangle",
  strokeColor: "#000000",
  fillColor: "",
  strokeWidth: 2,
};
