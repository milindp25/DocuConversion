/**
 * Compare PDFs tool page.
 * Allows users to upload two PDF files and compare them,
 * showing additions, deletions, and a similarity score.
 */

"use client";

import { useCallback, useState } from "react";

import { GitCompare, Loader2, CheckCircle2 } from "lucide-react";

import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { uploadFile } from "@/lib/api-client";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** A single diff entry from the comparison */
interface DiffEntry {
  /** Type of change: added, removed, or unchanged */
  type: "added" | "removed" | "unchanged";
  /** The text content of this diff segment */
  text: string;
}

/** Response shape from the compare endpoint */
interface CompareResponse {
  /** Overall similarity score (0-100) */
  similarity_score: number;
  /** List of diff entries */
  diffs: DiffEntry[];
}

export default function ComparePdfsPage() {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [result, setResult] = useState<CompareResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileASelect = useCallback((selected: File) => {
    setFileA(selected);
    setResult(null);
    setError(null);
  }, []);

  const handleFileBSelect = useCallback((selected: File) => {
    setFileB(selected);
    setResult(null);
    setError(null);
  }, []);

  const handleFileARemove = useCallback(() => {
    setFileA(null);
    setResult(null);
    setError(null);
  }, []);

  const handleFileBRemove = useCallback(() => {
    setFileB(null);
    setResult(null);
    setError(null);
  }, []);

  const handleCompare = useCallback(async () => {
    if (!fileA || !fileB) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", fileA);
      formData.append("file_b", fileB);

      const response = await fetch("/api/pdf/advanced/compare", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let detail = "Comparison failed";
        try {
          const errorBody = await response.json();
          detail = errorBody.detail || detail;
        } catch {
          detail = response.statusText;
        }
        throw new Error(detail);
      }

      const data: CompareResponse = await response.json();
      setResult(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Comparison failed. Please try again.";
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  }, [fileA, fileB]);

  return (
    <ToolPageLayout
      title="Compare PDFs"
      description="Compare two PDF documents and see the differences highlighted."
      category="advanced"
      icon={GitCompare}
    >
      {/* Side-by-side file uploaders */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            First PDF
          </p>
          <FileUploader
            acceptedTypes={ACCEPTED_FILE_TYPES.PDF}
            maxFileSize={MAX_FILE_SIZE.ANONYMOUS}
            onFileSelect={handleFileASelect}
            onFileRemove={handleFileARemove}
            disabled={isProcessing}
            label="Upload first PDF"
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Second PDF
          </p>
          <FileUploader
            acceptedTypes={ACCEPTED_FILE_TYPES.PDF}
            maxFileSize={MAX_FILE_SIZE.ANONYMOUS}
            onFileSelect={handleFileBSelect}
            onFileRemove={handleFileBRemove}
            disabled={isProcessing}
            label="Upload second PDF"
          />
        </div>
      </div>

      {/* Compare button */}
      <button
        type="button"
        onClick={handleCompare}
        disabled={!fileA || !fileB || isProcessing}
        aria-label="Compare the two uploaded PDFs"
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all duration-200",
          "hover:bg-amber-500 hover:shadow-xl hover:shadow-amber-500/30",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-60"
        )}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Comparing...
          </>
        ) : (
          <>
            <GitCompare className="h-4 w-4" aria-hidden="true" />
            Compare
          </>
        )}
      </button>

      {/* Error state */}
      {error && (
        <div role="alert" className="text-center text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div
          className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
          role="region"
          aria-label="Comparison results"
        >
          {/* Similarity score badge */}
          <div className="flex items-center justify-center border-b border-gray-200 px-5 py-6 dark:border-gray-700">
            <div className="text-center">
              <div
                className={cn(
                  "mx-auto inline-flex items-center gap-2 rounded-full px-6 py-3 text-lg font-bold shadow-sm",
                  Math.round(result.similarity_score) === 100
                    ? "bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300"
                    : result.similarity_score >= 80
                      ? "bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300"
                      : result.similarity_score >= 50
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/60 dark:text-yellow-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300"
                )}
              >
                <span className="text-3xl font-extrabold">
                  {Math.round(result.similarity_score)}%
                </span>
                <span className="text-sm font-medium">similar</span>
              </div>
              {Math.round(result.similarity_score) === 100 && (
                <div className="mt-3 flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                  <span className="text-sm font-semibold">
                    Documents are identical
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Diff output — code-diff style */}
          {Math.round(result.similarity_score) < 100 && (
            <div className="p-4">
              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                {result.diffs.map((diff, index) => (
                  <div
                    key={index}
                    className={cn(
                      "border-b border-gray-100 px-4 py-1.5 font-mono text-sm last:border-b-0 dark:border-gray-800",
                      diff.type === "added" &&
                        "bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-300",
                      diff.type === "removed" &&
                        "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300",
                      diff.type === "unchanged" &&
                        "bg-white text-gray-600 dark:bg-gray-900 dark:text-gray-400"
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mr-3 inline-block w-4 select-none text-center font-bold",
                        diff.type === "added" && "text-green-600 dark:text-green-400",
                        diff.type === "removed" && "text-red-600 dark:text-red-400",
                        diff.type === "unchanged" && "text-gray-300 dark:text-gray-600"
                      )}
                    >
                      {diff.type === "added" ? "+" : diff.type === "removed" ? "\u2212" : " "}
                    </span>
                    <span className="sr-only">
                      {diff.type === "added"
                        ? "Added: "
                        : diff.type === "removed"
                          ? "Removed: "
                          : ""}
                    </span>
                    {diff.text}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </ToolPageLayout>
  );
}
