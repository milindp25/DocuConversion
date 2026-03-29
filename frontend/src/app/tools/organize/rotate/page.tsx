/**
 * Rotate PDF pages tool page.
 * Allows users to rotate all or specific pages of a PDF by 90, 180, or 270 degrees.
 */

"use client";

import { useCallback, useState } from "react";

import { RotateCw } from "lucide-react";

import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { ProgressBar } from "@/components/tools/ProgressBar";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { useFileProcessor } from "@/hooks/useFileProcessor";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Available rotation angles */
const ROTATION_OPTIONS = [
  { value: "90", label: "90\u00B0" },
  { value: "180", label: "180\u00B0" },
  { value: "270", label: "270\u00B0" },
] as const;

export default function RotatePdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [rotation, setRotation] = useState("90");
  const [pageMode, setPageMode] = useState<"all" | "specific">("all");
  const [specificPages, setSpecificPages] = useState("");

  const { processFile, job, isProcessing, reset } = useFileProcessor({
    endpoint: "/organize/rotate",
  });

  const handleFileSelect = useCallback(
    (selected: File) => {
      setFile(selected);
      const pages = pageMode === "all" ? "all" : specificPages.trim() || "all";
      processFile(selected, { rotation, pages });
    },
    [processFile, rotation, pageMode, specificPages]
  );

  const handleFileRemove = useCallback(() => {
    setFile(null);
    reset();
  }, [reset]);

  const handleApplyRotation = useCallback(() => {
    if (!file) return;
    reset();
    const pages = pageMode === "all" ? "all" : specificPages.trim() || "all";
    processFile(file, { rotation, pages });
  }, [file, processFile, reset, rotation, pageMode, specificPages]);

  return (
    <ToolPageLayout
      title="Rotate PDF"
      description="Rotate all or specific pages of a PDF document"
      category="organize"
      icon={RotateCw}
    >
      {/* Rotation options — shown before and after file selection */}
      <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        {/* Rotation angle selector */}
        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Rotation angle
          </legend>
          <div className="flex gap-2" role="radiogroup" aria-label="Rotation angle">
            {ROTATION_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={rotation === option.value}
                onClick={() => setRotation(option.value)}
                disabled={isProcessing}
                className={cn(
                  "flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2",
                  rotation === option.value
                    ? "border-green-500 bg-green-50 text-green-700 dark:border-green-400 dark:bg-green-950 dark:text-green-300"
                    : "border-gray-200 text-gray-600 hover:border-green-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-green-600",
                  isProcessing && "pointer-events-none opacity-50"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Page selection */}
        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Pages to rotate
          </legend>
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="pageMode"
                value="all"
                checked={pageMode === "all"}
                onChange={() => setPageMode("all")}
                disabled={isProcessing}
                className="h-4 w-4 text-green-600 focus:ring-green-500 dark:bg-gray-800 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                All pages
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="pageMode"
                value="specific"
                checked={pageMode === "specific"}
                onChange={() => setPageMode("specific")}
                disabled={isProcessing}
                className="h-4 w-4 text-green-600 focus:ring-green-500 dark:bg-gray-800 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Specific pages
              </span>
            </label>

            {pageMode === "specific" && (
              <input
                type="text"
                value={specificPages}
                onChange={(e) => setSpecificPages(e.target.value)}
                placeholder="e.g. 1, 3, 5"
                disabled={isProcessing}
                aria-label="Page numbers to rotate"
                className={cn(
                  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400",
                  "focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500",
                  "dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500",
                  "dark:focus:border-green-400 dark:focus:ring-green-400",
                  isProcessing && "opacity-50"
                )}
              />
            )}
          </div>
        </fieldset>

        {/* Re-process button (visible when a file is already loaded and no job is running) */}
        {file && !isProcessing && (
          <button
            type="button"
            onClick={handleApplyRotation}
            className={cn(
              "w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors",
              "hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2",
              "dark:bg-green-700 dark:hover:bg-green-600"
            )}
          >
            Rotate pages
          </button>
        )}
      </div>

      <FileUploader
        acceptedTypes={ACCEPTED_FILE_TYPES.PDF}
        maxFileSize={MAX_FILE_SIZE.ANONYMOUS}
        onFileSelect={handleFileSelect}
        onFileRemove={handleFileRemove}
        disabled={isProcessing}
      />

      {job && (
        <ProgressBar
          progress={job.progress}
          statusMessage={
            job.status === "uploading"
              ? "Uploading..."
              : job.status === "processing"
                ? "Rotating pages..."
                : job.status === "completed"
                  ? "Rotation complete"
                  : "Rotation failed"
          }
          isComplete={job.status === "completed"}
          isError={job.status === "failed"}
          errorMessage={job.errorMessage}
        />
      )}

      {job?.status === "completed" && job.downloadUrl && (
        <div className="flex justify-center">
          <DownloadButton
            downloadUrl={job.downloadUrl}
            fileName={
              file?.name.replace(/\.pdf$/i, "_rotated.pdf") ?? "rotated.pdf"
            }
          />
        </div>
      )}
    </ToolPageLayout>
  );
}
