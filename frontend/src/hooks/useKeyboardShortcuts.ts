/**
 * Global keyboard shortcuts for DocuConversion.
 * Registers handlers for common keyboard shortcuts used across tool pages.
 *
 * Supported shortcuts:
 * - Ctrl/Cmd + S: Download the processed file (if available)
 * - Ctrl/Cmd + N: Start a new file / reset the current tool
 * - Escape: Reset / cancel the current operation
 */

"use client";

import { useEffect } from "react";

/** Handler callbacks for each supported keyboard shortcut */
export interface KeyboardShortcutHandlers {
  /** Called when Ctrl/Cmd + S is pressed (download) */
  onDownload?: () => void;
  /** Called when Ctrl/Cmd + N is pressed (new file / reset) */
  onReset?: () => void;
  /** Called when Escape is pressed (cancel / reset) */
  onUpload?: () => void;
}

/**
 * Registers global keyboard shortcut listeners for tool pages.
 * Automatically cleans up listeners on unmount.
 *
 * @param handlers - Callback functions for each shortcut action
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts({
 *   onDownload: () => triggerDownload(),
 *   onReset: () => resetTool(),
 * });
 * ```
 */
export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S: Download (if available)
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handlers.onDownload?.();
      }
      // Ctrl/Cmd + N: New file / reset
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        handlers.onReset?.();
      }
      // Escape: Reset/cancel
      if (e.key === "Escape") {
        handlers.onReset?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlers]);
}
