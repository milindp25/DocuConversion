/**
 * Custom hook for managing the file processing lifecycle.
 * Handles upload, polling for status, and result retrieval.
 * Used by every tool page to orchestrate file conversion/editing.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { uploadFile, apiRequest } from "@/lib/api-client";
import { saveToHistory } from "@/lib/file-history";
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

  /** Stops the polling interval if active */
  const stopPolling = useCallback(() => {
    if (pollTimerRef.current !== null) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  /** Polls the backend for job status until completion or failure */
  const startPolling = useCallback(
    (jobId: string, fileName: string) => {
      stopPolling();

      pollTimerRef.current = setInterval(async () => {
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

            // Persist completed jobs to localStorage for dashboard history
            if (status.status === "completed" && status.download_url) {
              saveToHistory({
                id: status.job_id,
                filename: fileName,
                operation: endpoint.replace(/^\//, "").replace(/\//g, " > "),
                date: new Date().toISOString(),
                downloadUrl: status.download_url,
              });
            }
          }
        } catch {
          stopPolling();
          setJob((prev) =>
            prev
              ? {
                  ...prev,
                  status: "failed",
                  errorMessage: "Lost connection to the server. Please try again.",
                }
              : null
          );
          setIsProcessing(false);
        }
      }, POLL_INTERVAL_MS);
    },
    [stopPolling]
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
      setJob({
        jobId: "",
        status: "uploading",
        progress: 0,
        fileName: file.name,
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
