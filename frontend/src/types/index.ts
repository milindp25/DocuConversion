/**
 * Shared TypeScript types for DocuConversion.
 * These types are used across components, hooks, and API interactions.
 */

/** Tool categories — each has a distinct color scheme in the UI */
export type ToolCategory = "convert" | "edit" | "organize" | "sign" | "secure" | "ai" | "advanced";

/** Represents a single tool available in DocuConversion */
export interface Tool {
  /** URL-friendly identifier (e.g., "pdf-to-word") */
  id: string;
  /** Human-readable tool name (e.g., "PDF to Word") */
  name: string;
  /** Brief description shown on tool cards */
  description: string;
  /** Category for grouping and color coding */
  category: ToolCategory;
  /** URL path to the tool page */
  href: string;
  /** Lucide icon name for display */
  icon: string;
  /** File types accepted for upload */
  acceptedTypes: string[];
  /** Output format description */
  outputFormat: string;
}

/** Possible states for a file processing job */
export type JobStatus = "uploading" | "processing" | "completed" | "failed";

/** Tracks the state of a file being processed */
export interface ProcessingJob {
  /** Unique job identifier from the backend */
  jobId: string;
  /** Current processing status */
  status: JobStatus;
  /** Progress percentage (0-100) */
  progress: number;
  /** Original uploaded file name */
  fileName: string;
  /** URL to download the processed result (set when completed) */
  downloadUrl?: string;
  /** Error message if the job failed */
  errorMessage?: string;
}

/** User tier determines feature access and limits */
export type UserTier = "anonymous" | "free" | "premium";

/** Represents the current user's session state */
export interface UserSession {
  /** Whether the user is logged in */
  isAuthenticated: boolean;
  /** User's subscription tier */
  tier: UserTier;
  /** Remaining daily operations */
  operationsRemaining: number;
}
