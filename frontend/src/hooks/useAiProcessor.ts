/**
 * Custom hook for managing AI-powered file processing.
 * Unlike useFileProcessor, AI endpoints return JSON results inline
 * (no polling required). Used by summarize, extract, and chat tools.
 */

"use client";

import { useCallback, useState } from "react";

import { uploadFile } from "@/lib/api-client";

/** Configuration options for useAiProcessor */
export interface UseAiProcessorOptions {
  /** API endpoint for this AI tool (e.g., "/ai/summarize") */
  endpoint: string;
}

/** Return value of the useAiProcessor hook */
export interface UseAiProcessorReturn<T> {
  /** Upload and process a file through the AI endpoint */
  processFile: (file: File, options?: Record<string, string>) => Promise<void>;
  /** The AI-generated result (null until processing completes) */
  result: T | null;
  /** Whether processing is in progress */
  isProcessing: boolean;
  /** Error message if processing failed */
  error: string | null;
  /** Reset to initial state */
  reset: () => void;
}

/**
 * Manages the AI file processing lifecycle: upload, wait for inline JSON
 * response, and surface the result or error state.
 *
 * @param options - Configuration including the API endpoint
 * @returns Object with processFile, result, isProcessing, error, and reset
 *
 * @example
 * ```tsx
 * const { processFile, result, isProcessing, error, reset } = useAiProcessor<SummaryResult>({
 *   endpoint: "/ai/summarize",
 * });
 *
 * await processFile(selectedFile, { length: "short" });
 *
 * if (result) {
 *   // Render the AI-generated summary
 * }
 * ```
 */
export function useAiProcessor<T>({
  endpoint,
}: UseAiProcessorOptions): UseAiProcessorReturn<T> {
  const [result, setResult] = useState<T | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Uploads a file to the AI endpoint and stores the inline JSON result.
   *
   * @param file - The file to process
   * @param options - Optional additional form data fields
   */
  const processFile = useCallback(
    async (file: File, options?: Record<string, string>) => {
      setIsProcessing(true);
      setError(null);
      setResult(null);

      try {
        const response = await uploadFile<T>(endpoint, file, options);
        setResult(response);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Processing failed. Please try again.";
        setError(message);
      } finally {
        setIsProcessing(false);
      }
    },
    [endpoint]
  );

  /** Resets all state back to initial values */
  const reset = useCallback(() => {
    setResult(null);
    setIsProcessing(false);
    setError(null);
  }, []);

  return { processFile, result, isProcessing, error, reset };
}
