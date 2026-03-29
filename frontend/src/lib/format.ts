/**
 * Formatting utilities for DocuConversion.
 * Provides human-readable representations of file sizes and other values.
 */

/** Size unit thresholds for file size formatting */
const SIZE_UNITS = ["B", "KB", "MB", "GB"] as const;
const BYTES_PER_UNIT = 1024;

/**
 * Formats a byte count into a human-readable file size string.
 * Uses binary units (1 KB = 1024 bytes) for consistency with OS file sizes.
 *
 * @param bytes - File size in bytes (must be non-negative)
 * @returns Formatted string (e.g., "2.4 MB", "156 KB", "0 B")
 *
 * @example
 * formatFileSize(2516582) // => "2.4 MB"
 * formatFileSize(156000)  // => "152.3 KB"
 * formatFileSize(0)       // => "0 B"
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 0) {
    return "0 B";
  }

  if (bytes === 0) {
    return "0 B";
  }

  let unitIndex = 0;
  let size = bytes;

  while (size >= BYTES_PER_UNIT && unitIndex < SIZE_UNITS.length - 1) {
    size /= BYTES_PER_UNIT;
    unitIndex++;
  }

  const unit = SIZE_UNITS[unitIndex];

  // Show integers for bytes, one decimal for KB+
  if (unitIndex === 0) {
    return `${Math.round(size)} ${unit}`;
  }

  return `${size.toFixed(1)} ${unit}`;
}
