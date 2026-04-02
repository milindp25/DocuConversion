/**
 * Custom hook for managing the file processing lifecycle.
 * Handles upload, polling for status, and result retrieval.
 * Used by every tool page to orchestrate file conversion/editing.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { uploadFile, apiRequest } from "@/lib/api-client";
import { saveToHistory } from "@/lib/file-history";
import { posthog } from "@/lib/posthog";
import type { ProcessingJob, JobStatus } from "@/types";

/** Configuration options for useFileProcessor */
export interface UseFileProcessorOptions {
  /** API endpoint for this tool (e.g., "/convert/pdf-to-word") */
  endpoint: string;
}

/** Return value of the useFileProcessor hook */
export interface UseFileProcessorReturn {
  /** Upload and start processing a file */
  processFile: (file: File, options?: Record<string, string>) => Promise<void>;
  /** Current job state */
  job: ProcessingJob | null;
  /** Whether processing is in progress */
  isProcessing: boolean;
  /** Reset to initial state */
  reset: () => void;
}

/** Backend response when a file upload is accepted */
interface UploadResponse {
  job_id: string;
}

/** Backend response when polling job status */
interface StatusResponse {
  job_id: string;
  status: JobStatus;
  progress: number;
  download_url?: string;
  error_message?: string;
}

/** Interval between status poll requests (ms) */
const POLL_INTERVAL_MS = 2000;

/** Maximum time to poll before timing out (ms) */
const MAX_POLL_TIME_MS = 120_000;

/**
 * Manages the full file processing lifecycle: upload, poll for progress,
 * and surface completion or error state.
 *
 * @param options - Configuration including the API endpoint
 * @returns Object with processFile, job state, isProcessing flag, and reset
 *
 * @example
 * ```tsx
 * const { processFile, job, isProcessing, reset } = useFileProcessor({
 *   endpoint: "/convert/pdf-to-word",
 * });
 *
 * // Start processing
 * await processFile(selectedFile);
 *
 * // Check state
 * if (job?.status === "completed") {
 *   // Show download button with job.downloadUrl
 * }
 * ```
 */
export function useFileProcessor({
  endpoint,
}: UseFileProcessorOptions): UseFileProcessorReturn {
  const [job, setJob] = useState<ProcessingJob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollStartRef = useRef<number>(0);
  const uploadStartRef = useRef<number>(0);
  const fileSizeKbRef = useRef<number>(0);

  /** Stops the polling interval if active */
  const stopPolling = useCallback(() => {
    if (pollTimerRef.current !== null) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  /**
   * Dispatches a custom event to trigger a toast notification.
   * The ToastProvider listens for these events.
   */
  const dispatchToast = useCallback(
    (type: "success" | "error", message: string) => {
      window.dispatchEvent(
        new CustomEvent("docuconversion:toast", {
          detail: { type, message },
        })
      );
    },
    []
  );

  /** Polls the backend for job status until completion, failure, or timeout */
  const startPolling = useCallback(
    (jobId: string, fileName: string) => {
      stopPolling();
      pollStartRef.current = Date.now();

      pollTimerRef.current = setInterval(async () => {
        // Check for polling timeout
        if (Date.now() - pollStartRef.current > MAX_POLL_TIME_MS) {
          stopPolling();
          setJob((prev) =>
            prev
              ? {
                  ...prev,
                  status: "failed",
                  errorMessage: "Request timed out. Please try again.",
                }
              : null
          );
          setIsProcessing(false);
          dispatchToast("error", "Request timed out. Please try again.");
          return;
        }

        try {
          const status = await apiRequest<StatusResponse>(
            `/jobs/status/${jobId}`
          );

          const updatedJob: ProcessingJob = {
            jobId: status.job_id,
            status: status.status,
            progress: status.progress,
            fileName,
            downloadUrl: status.download_url,
            errorMessage: status.error_message,
          };

          setJob(updatedJob);

          if (status.status === "completed" || status.status === "failed") {
            stopPolling();
            setIsProcessing(false);

            if (status.status === "completed" && status.download_url) {
              // Persist completed jobs to localStorage for dashboard history
              saveToHistory({
                id: status.job_id,
                filename: fileName,
                operation: endpoint.replace(/^\//, "").replace(/\//g, " > "),
                date: new Date().toISOString(),
                downloadUrl: status.download_url,
              });
              dispatchToast("success", "Conversion complete! Your file is ready to download.");

              posthog.capture("tool_completed", {
                endpoint,
                file_size_kb: fileSizeKbRef.current,
                duration_ms: Date.now() - uploadStartRef.current,
              });
            }

            if (status.status === "failed") {
              dispatchToast(
                "error",
                status.error_message || "Processing failed. Please try again."
              );

              posthog.capture("tool_failed", {
                endpoint,
                error_message: status.error_message ?? "Processing failed",
              });
            }
          }
        } catch {
          stopPolling();
          const errorMsg = "Lost connection to the server. Please try again.";
          setJob((prev) =>
            prev
              ? {
                  ...prev,
                  status: "failed",
                  errorMessage: errorMsg,
                }
              : null
          );
          setIsProcessing(false);
          dispatchToast("error", errorMsg);
        }
      }, POLL_INTERVAL_MS);
    },
    [stopPolling, dispatchToast]
  );

  /**
   * Uploads a file and begins polling for processing progress.
   *
   * @param file - The file to process
   * @param options - Optional additional form data fields
   */
  const processFile = useCallback(
    async (file: File, options?: Record<string, string>) => {
      setIsProcessing(true);
      uploadStartRef.current = Date.now();
      fileSizeKbRef.current = Math.round(file.size / 1024);
      setJob({
        jobId: "",
        status: "uploading",
        progress: 0,
        fileName: file.name,
      });

      posthog.capture("tool_file_upload", {
        endpoint,
        file_size_kb: fileSizeKbRef.current,
      });

      try {
        const response = await uploadFile<UploadResponse>(
          endpoint,
          file,
          options
        );

        setJob({
          jobId: response.job_id,
          status: "processing",
          progress: 0,
          fileName: file.name,
        });

        startPolling(response.job_id, file.name);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Upload failed. Please try again.";

        setJob({
          jobId: "",
          status: "failed",
          progress: 0,
          fileName: file.name,
          errorMessage: message,
        });
        setIsProcessing(false);
      }
    },
    [endpoint, startPolling]
  );

  /** Stop polling on unmount to prevent state updates on unmounted component */
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  /** Resets all state back to initial values */
  const reset = useCallback(() => {
    stopPolling();
    setJob(null);
    setIsProcessing(false);
  }, [stopPolling]);

  return { processFile, job, isProcessing, reset };
}
