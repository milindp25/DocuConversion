/**
 * Split PDF tool page.
 * Splits a PDF into separate documents by page range.
 * Offers "each page as separate file" or "custom page range" modes.
 */

"use client";

import { useCallback, useState } from "react";

import { Scissors } from "lucide-react";

import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { ProgressBar } from "@/components/tools/ProgressBar";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { useFileProcessor } from "@/hooks/useFileProcessor";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from "@/lib/constants";
import { cn } from "@/lib/utils";

type SplitMode = "each-page" | "custom";

export default function SplitPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [splitMode, setSplitMode] = useState<SplitMode>("each-page");
  const [pageRange, setPageRange] = useState("");
  const { processFile, job, isProcessing, reset } = useFileProcessor({
    endpoint: "/organize/split",
  });

  const handleFileSelect = useCallback((selected: File) => {
    setFile(selected);
  }, []);

  const handleFileRemove = useCallback(() => {
    setFile(null);
    reset();
  }, [reset]);

  const handleSplit = useCallback(() => {
    if (!file) return;
    const options: Record<string, string> = { mode: splitMode };
    if (splitMode === "custom" && pageRange.trim()) {
      options.page_range = pageRange.trim();
    }
    processFile(file, options);
  }, [file, splitMode, pageRange, processFile]);

  return (
    <ToolPageLayout
      title="Split PDF"
      description="Split a PDF into separate documents by page range"
      category="organize"
      icon={Scissors}
      supportingContent={
        <>
          <h2>How to Split a PDF</h2>
          <p>
            Upload a PDF and choose a split mode. Select "Each page as separate file"
            to get one PDF per page, or use "Custom page range" to specify exactly
            which pages to extract (for example 1-3, 5, 8-10). Click Split and
            download the resulting ZIP archive.
          </p>
          <h2>Split by Range or Individual Pages</h2>
          <p>
            Custom ranges let you pull out a specific chapter, remove unwanted pages,
            or isolate a single form from a larger packet. Ranges can be combined
            freely, so you can extract non-consecutive pages in one step.
          </p>
          <h2>Extracting Specific Pages</h2>
          <p>
            Need just the signature page from a contract or one chart from a report?
            Enter that page number in the custom range field and the splitter will
            produce a standalone PDF containing only the pages you selected, with
            original quality and formatting intact.
          </p>
        </>
      }
    >
      <FileUploader
        acceptedTypes={ACCEPTED_FILE_TYPES.PDF}
        maxFileSize={MAX_FILE_SIZE.ANONYMOUS}
        onFileSelect={handleFileSelect}
        onFileRemove={handleFileRemove}
        disabled={isProcessing}
      />

      {/* Split options */}
      {file && !isProcessing && !job?.downloadUrl && (
        <div className="space-y-4">
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Split mode
            </legend>
            <div className="flex gap-3">
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors",
                  splitMode === "each-page"
                    ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                    : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                )}
              >
                <input
                  type="radio"
                  name="split-mode"
                  value="each-page"
                  checked={splitMode === "each-page"}
                  onChange={() => setSplitMode("each-page")}
                  className="sr-only"
                />
                Each page as separate file
              </label>

              <label
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors",
                  splitMode === "custom"
                    ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                    : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                )}
              >
                <input
                  type="radio"
                  name="split-mode"
                  value="custom"
                  checked={splitMode === "custom"}
                  onChange={() => setSplitMode("custom")}
                  className="sr-only"
                />
                Custom page range
              </label>
            </div>
          </fieldset>

          {splitMode === "custom" && (
            <div>
              <label
                htmlFor="page-range"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Page range (e.g., 1-3, 5, 8-10)
              </label>
              <input
                id="page-range"
                type="text"
                value={pageRange}
                onChange={(e) => setPageRange(e.target.value)}
                placeholder="1-3, 5, 8-10"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
          )}

          <button
            type="button"
            onClick={handleSplit}
            disabled={splitMode === "custom" && !pageRange.trim()}
            className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Split PDF
          </button>
        </div>
      )}

      {job && (
        <ProgressBar
          progress={job.progress}
          statusMessage={
            job.status === "uploading"
              ? "Uploading..."
              : job.status === "processing"
                ? "Splitting PDF..."
                : job.status === "completed"
                  ? "Split complete"
                  : "Split failed"
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
              file?.name.replace(/\.pdf$/i, "-split.zip") ?? "split.zip"
            }
          />
        </div>
      )}
    </ToolPageLayout>
  );
}
