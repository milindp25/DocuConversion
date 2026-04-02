/**
 * Compress PDF tool page.
 * Reduces PDF file size while maintaining quality.
 * Offers three compression level presets as selectable cards.
 */

"use client";

import { useCallback, useState } from "react";

import { Minimize2 } from "lucide-react";

import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { ProgressBar } from "@/components/tools/ProgressBar";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { useFileProcessor } from "@/hooks/useFileProcessor";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from "@/lib/constants";
import { cn } from "@/lib/utils";

type CompressionLevel = "low" | "recommended" | "high";

const COMPRESSION_OPTIONS: {
  value: CompressionLevel;
  label: string;
  description: string;
}[] = [
  {
    value: "low",
    label: "Low compression",
    description: "Best quality, larger file",
  },
  {
    value: "recommended",
    label: "Recommended",
    description: "Good balance of size and quality",
  },
  {
    value: "high",
    label: "Maximum compression",
    description: "Smallest file, reduced quality",
  },
];

export default function CompressPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<CompressionLevel>("recommended");
  const { processFile, job, isProcessing, reset } = useFileProcessor({
    endpoint: "/organize/compress",
  });

  const handleFileSelect = useCallback((selected: File) => {
    setFile(selected);
  }, []);

  const handleFileRemove = useCallback(() => {
    setFile(null);
    reset();
  }, [reset]);

  const handleCompress = useCallback(() => {
    if (!file) return;
    processFile(file, { level });
  }, [file, level, processFile]);

  return (
    <ToolPageLayout
      title="Compress PDF"
      description="Reduce PDF file size while maintaining quality"
      category="organize"
      icon={Minimize2}
      supportingContent={
        <>
          <h2>How to Compress a PDF</h2>
          <p>
            Upload your PDF, choose a compression level, and click Compress. Low
            compression preserves the highest quality, Recommended balances size and
            clarity, and Maximum compression produces the smallest file. Download the
            result when processing completes.
          </p>
          <h2>When to Compress PDFs</h2>
          <p>
            Large PDFs are difficult to send by email, slow to load on websites, and
            consume unnecessary storage. Compressing before sharing keeps attachments
            under common size limits and speeds up page loads for documents published
            online.
          </p>
          <h2>File Safety and Quality</h2>
          <p>
            Your original file is never modified. The compressor reduces image
            resolution and optimizes internal PDF structures while keeping text
            fully readable. All processing happens on the server and files are
            automatically deleted after a short retention period.
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

      {/* Compression level cards */}
      {file && !isProcessing && !job?.downloadUrl && (
        <div className="space-y-4">
          <fieldset>
            <legend className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              Compression level
            </legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {COMPRESSION_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer flex-col rounded-lg border p-4 text-center transition-colors",
                    level === option.value
                      ? "border-green-500 bg-green-50 ring-1 ring-green-500 dark:bg-green-950"
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                  )}
                >
                  <input
                    type="radio"
                    name="compression-level"
                    value={option.value}
                    checked={level === option.value}
                    onChange={() => setLevel(option.value)}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      level === option.value
                        ? "text-green-700 dark:text-green-300"
                        : "text-gray-900 dark:text-white"
                    )}
                  >
                    {option.label}
                  </span>
                  <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {option.description}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="button"
            onClick={handleCompress}
            className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700"
          >
            Compress PDF
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
                ? "Compressing..."
                : job.status === "completed"
                  ? "Compression complete"
                  : "Compression failed"
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
              file?.name.replace(/\.pdf$/i, "-compressed.pdf") ??
              "compressed.pdf"
            }
          />
        </div>
      )}
    </ToolPageLayout>
  );
}
