/**
 * Barrel exports for the PDF editor components.
 * Re-exports all editor sub-components for clean imports.
 */

export { EditorToolbar } from "./EditorToolbar";
export { EditorCanvas } from "./EditorCanvas";
export { AnnotationPanel } from "./AnnotationPanel";
export { AddTextForm, AddHighlightForm, AddShapeForm } from "./AnnotationForms";

export type { EditorToolbarProps } from "./EditorToolbar";
export type { EditorCanvasProps } from "./EditorCanvas";
export type { AnnotationPanelProps } from "./AnnotationPanel";
export type { AddFormProps } from "./AnnotationForms";
