/**
 * Saved signatures management for DocuConversion.
 * Persists electronic signature images in localStorage so users can
 * reuse them across documents. Free tier is limited to 3 signatures.
 */

/** Shape of a saved signature entry */
export interface SavedSignature {
  /** Unique identifier for the signature */
  id: string;
  /** User-assigned display name (e.g., "My Formal Signature") */
  name: string;
  /** Base64-encoded data URL of the signature PNG image */
  imageDataUrl: string;
  /** ISO 8601 date string when the signature was created */
  createdAt: string;
}

/** localStorage key used to persist saved signatures */
const STORAGE_KEY = "docuconversion_saved_signatures";

/** Maximum signatures allowed for the free tier */
export const MAX_SIGNATURES_FREE = 3;

/**
 * Save a new signature to localStorage.
 * Appends to the end of the list. Does not enforce the tier limit
 * here — callers should check getSignatures().length before saving.
 *
 * @param sig - The signature entry to save
 */
export function saveSignature(sig: SavedSignature): void {
  if (typeof window === "undefined") return;

  const signatures = getSignatures();
  // Avoid duplicates by id
  const filtered = signatures.filter((s) => s.id !== sig.id);
  const updated = [...filtered, sig];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage may be full or unavailable — silently ignore
  }
}

/**
 * Retrieve all saved signatures from localStorage.
 * Returns an empty array if none exist or parsing fails.
 *
 * @returns Array of SavedSignature sorted by creation date
 */
export function getSignatures(): SavedSignature[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as SavedSignature[];
  } catch {
    return [];
  }
}

/**
 * Delete a saved signature by its ID.
 *
 * @param id - The unique ID of the signature to remove
 */
export function deleteSignature(id: string): void {
  if (typeof window === "undefined") return;

  const signatures = getSignatures();
  const updated = signatures.filter((s) => s.id !== id);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Silently ignore storage errors
  }
}
