/**
 * Batch processing tool page.
 * Allows users to upload multiple PDFs and apply a single operation
 * (compress or flatten) to all of them at once. Results are returned
 * as a ZIP archive.
 */

"use client";

import { useCallback, useRef, useState } from "react";

import { Layers, Download, Loader2, X, FileIcon, AlertCircle } from "lucide-react";

import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from "@/lib/constants";
import { formatFileSize } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Available batch operations */
const BATCH_OPERATIONS = [
  { value: "compress", label: "Compress" },
  { value: "flatten", label: "Flatten" },
] as const;

type BatchOperation = (typeof BATCH_OPERATIONS)[number]["value"];

/** Per-file progress state */
interface FileProgress {
  fileName: string;
  status: "pending" | "uploading" | "completed" | "failed";
  progress: number;
}

/**
 * Batch processing page. Accepts multiple PDF uploads, lets the user
 * choose an operation, sends them all to /advanced/batch, and offers
 * the ZIP result for download.
 */
export default function BatchProcessingPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [operation, setOperation] = useState<BatchOperation>("compress");
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileProgress, setFileProgress] = useState<FileProgress[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /** Handle files selected through the FileUploader */
  const handleFileSelect = useCallback((file: File) => {
    setFiles((prev) => {
      // Prevent duplicates by name
      if (prev.some((f) => f.name === file.name)) return prev;
      return [...prev, file];
    });
    setDownloadUrl(null);
    setError(null);
  }, []);

  /** Handle removing the file shown in the FileUploader */
  const handleFileRemove = useCallback(() => {
    // The FileUploader's remove clears its internal state;
    // we keep our files list intact so users can add more.
  }, []);

  /** Remove a specific file from the queue */
  const removeFile = useCallback((fileName: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== fileName));
  }, []);

  /** Clear all files */
  const resetAll = useCallback(() => {
    setFiles([]);
    setFileProgress([]);
    setDownloadUrl(null);
    setError(null);
    setIsProcessing(false);
  }, []);

  /** Upload all files and process them */
  const handleProcessAll = useCallback(async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setError(null);
    setDownloadUrl(null);

    // Initialize progress for each file
    const initialProgress: FileProgress[] = files.map((f) => ({
      fileName: f.name,
      status: "pending",
      progress: 0,
    }));
    setFileProgress(initialProgress);

    try {
      const formData = new FormData();
      files.forEach((f) => {
        formData.append("files", f);
      });
      formData.append("operation", operation);

      // Mark all as uploading
      setFileProgress((prev) =>
        prev.map((fp) => ({ ...fp, status: "uploading", progress: 50 }))
      );

      const response = await fetch(`/api/pdf/advanced/batch`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let detail = "Batch processing failed";
        try {
          const errorBody = await response.json();
          detail = errorBody.detail || detail;
        } catch {
          detail = response.statusText;
        }
        throw new Error(detail);
      }

      const result = await response.json();

      // Mark all as completed
      setFileProgress((prev) =>
        prev.map((fp) => ({ ...fp, status: "completed", progress: 100 }))
      );

      // The batch endpoint returns a job with download_url
      if (result.download_url) {
        setDownloadUrl(result.download_url);
      } else if (result.job_id) {
        // Poll for result
        const pollUrl = `/api/pdf/jobs/status/${result.job_id}`;
        let attempts = 0;
        const maxAttempts = 60;
        const pollInterval = 2000;

        const poll = async (): Promise<void> => {
          if (attempts >= maxAttempts) {
            throw new Error("Processing timed out. Please try again.");
          }
          attempts++;

          const statusRes = await fetch(pollUrl);
          if (!statusRes.ok) throw new Error("Failed to check job status");

          const statusData = await statusRes.json();

          if (statusData.status === "completed" && statusData.download_url) {
            setDownloadUrl(statusData.download_url);
            return;
          } else if (statusData.status === "failed") {
            throw new Error(
              statusData.error_message || "Batch processing failed"
            );
          }

          // Update progress
          const progress = Math.min(statusData.progress || 50, 99);
          setFileProgress((prev) =>
            prev.map((fp) => ({ ...fp, progress }))
          );

          await new Promise((resolve) => setTimeout(resolve, pollInterval));
          return poll();
        };

        await poll();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Batch processing failed";
      setError(message);
      setFileProgress((prev) =>
        prev.map((fp) => ({ ...fp, status: "failed", progress: 0 }))
      );
    } finally {
      setIsProcessing(false);
    }
  }, [files, operation]);

  return (
    <ToolPageLayout
      title="Batch Processing"
      description="Apply the same operation to multiple PDFs at once and download the results as a ZIP"
      category="advanced"
      icon={Layers}
    >
      {/* File uploader — accepts multiple PDFs */}
      {files.length === 0 && (
        <FileUploader
          acceptedTypes={ACCEPTED_FILE_TYPES.PDF}
          maxFileSize={MAX_FILE_SIZE.ANONYMOUS}
          onFileSelect={handleFileSelect}
          onFileRemove={handleFileRemove}
          disabled={isProcessing}
          multiple
          label="Drag & drop your PDF files here, or browse"
        />
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-300">
              {files.length} file{files.length !== 1 ? "s" : ""} selected
            </p>
            {!isProcessing && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-sm font-medium text-blue-400 hover:text-blue-300"
              >
                + Add more
              </button>
            )}
            {/* Hidden input for adding more files */}
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_FILE_TYPES.PDF.join(",")}
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  Array.from(e.target.files).forEach((f) => {
                    handleFileSelect(f);
                  });
                }
                e.target.value = "";
              }}
              className="sr-only"
            />
          </div>

          {files.map((file) => {
            const fp = fileProgress.find((p) => p.fileName === file.name);
            return (
              <div
                key={file.name}
                className="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-3"
              >
                <FileIcon
                  className="h-5 w-5 flex-shrink-0 text-blue-400"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>

                {/* Per-file progress */}
                {fp && fp.status !== "pending" && (
                  <div className="w-20">
                    <div className="h-1.5 overflow-hidden rounded-full bg-gray-700">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          fp.status === "completed"
                            ? "bg-green-500"
                            : fp.status === "failed"
                              ? "bg-red-500"
                              : "bg-blue-500"
                        )}
                        style={{ width: `${fp.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {!isProcessing && (
                  <button
                    type="button"
                    onClick={() => removeFile(file.name)}
                    aria-label={`Remove ${file.name}`}
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded text-gray-500 hover:bg-red-950 hover:text-red-400"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Operation selector */}
      {files.length > 0 && (
        <div className="space-y-2">
          <label
            htmlFor="batch-operation"
            className="block text-sm font-medium text-gray-300"
          >
            Operation
          </label>
          <select
            id="batch-operation"
            value={operation}
            onChange={(e) => setOperation(e.target.value as BatchOperation)}
            disabled={isProcessing}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          >
            {BATCH_OPERATIONS.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-800/50 bg-red-950/30 p-4 text-sm text-red-400"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Process button */}
      {files.length > 0 && !downloadUrl && (
        <button
          type="button"
          onClick={handleProcessAll}
          disabled={isProcessing || files.length === 0}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-200",
            isProcessing
              ? "cursor-not-allowed bg-gray-700"
              : "bg-blue-600 shadow-blue-600/25 hover:bg-blue-500 hover:shadow-xl hover:shadow-blue-600/30"
          )}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing {files.length} file{files.length !== 1 ? "s" : ""}...
            </>
          ) : (
            <>Process All</>
          )}
        </button>
      )}

      {/* Download result */}
      {downloadUrl && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-green-800/50 bg-green-950/20 p-6">
          <p className="text-sm font-medium text-green-400">
            All files processed successfully!
          </p>
          <a
            href={downloadUrl}
            download="batch_result.zip"
            className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:bg-green-500"
          >
            <Download className="h-4 w-4" />
            Download ZIP
          </a>
          <button
            type="button"
            onClick={resetAll}
            className="text-sm text-gray-400 hover:text-white"
          >
            Process more files
          </button>
        </div>
      )}
    </ToolPageLayout>
  );
}
