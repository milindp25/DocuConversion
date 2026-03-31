/**
 * File history management for DocuConversion.
 * Persists completed job entries in localStorage so users can view
 * their recent conversions in the dashboard. Provides helpers to
 * save, retrieve, and clear the history list.
 */

/** Shape of a single file history entry stored in localStorage */
export interface FileHistoryEntry {
  /** Unique identifier (typically the backend job ID) */
  id: string;
  /** Original uploaded filename */
  filename: string;
  /** Operation performed (e.g., "PDF to Word", "Compress") */
  operation: string;
  /** ISO 8601 date string when the job completed */
  date: string;
  /** Signed download URL for the result file */
  downloadUrl: string;
}

/** localStorage key used to persist file history */
const STORAGE_KEY = "docuconversion_file_history";

/** Maximum number of entries to retain */
const MAX_ENTRIES = 50;

/**
 * Save a completed job to the file history.
 * Prepends the new entry so the most recent appears first.
 * Trims the list to MAX_ENTRIES to avoid unbounded growth.
 *
 * @param entry - The file history entry to save
 */
export function saveToHistory(entry: FileHistoryEntry): void {
  if (typeof window === "undefined") return;

  const history = getHistory();
  // Avoid duplicates by id
  const filtered = history.filter((h) => h.id !== entry.id);
  const updated = [entry, ...filtered].slice(0, MAX_ENTRIES);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage may be full or unavailable — silently ignore
  }
}

/**
 * Retrieve the full file history from localStorage.
 * Returns an empty array if no history exists or parsing fails.
 *
 * @returns Array of FileHistoryEntry sorted by most recent first
 */
export function getHistory(): FileHistoryEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as FileHistoryEntry[];
  } catch {
    return [];
  }
}

/**
 * Clear all file history from localStorage.
 */
export function clearHistory(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently ignore storage errors
  }
}
