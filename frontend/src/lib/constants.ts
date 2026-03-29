/**
 * Application-wide constants for DocuConversion.
 * Centralizes configuration values to avoid magic numbers and strings.
 */

/** Maximum file upload sizes per user tier (in bytes) */
export const MAX_FILE_SIZE = {
  ANONYMOUS: 10 * 1024 * 1024,   // 10MB
  FREE: 25 * 1024 * 1024,        // 25MB
  PREMIUM: 100 * 1024 * 1024,    // 100MB
} as const;

/** Daily operation limits per user tier */
export const DAILY_OPERATION_LIMIT = {
  ANONYMOUS: 5,
  FREE: 20,
  PREMIUM: Infinity,
} as const;

/** Supported file types for upload, grouped by conversion category */
export const ACCEPTED_FILE_TYPES = {
  PDF: [".pdf"],
  WORD: [".doc", ".docx"],
  EXCEL: [".xls", ".xlsx"],
  POWERPOINT: [".ppt", ".pptx"],
  IMAGE: [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".tiff", ".webp"],
  HTML: [".html", ".htm"],
  TEXT: [".txt"],
} as const;

/** Color scheme for tool categories — used in navigation and tool cards */
export const TOOL_CATEGORY_COLORS = {
  convert: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200", icon: "text-blue-500" },
  edit: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200", icon: "text-purple-500" },
  organize: { bg: "bg-green-50", text: "text-green-600", border: "border-green-200", icon: "text-green-500" },
  sign: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200", icon: "text-orange-500" },
  secure: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200", icon: "text-red-500" },
  ai: { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-200", icon: "text-indigo-500" },
  advanced: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", icon: "text-amber-500" },
} as const;

/**
 * API base URL — resolved from validated environment variables.
 * @see {@link ./env.ts} for Zod-based env validation.
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/** Application metadata */
export const APP_NAME = "DocuConversion";
export const APP_DESCRIPTION = "Convert, edit, sign, and organize PDFs — all in one place. Free, fast, and private.";
