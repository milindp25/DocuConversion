/**
 * Add Page Numbers tool page.
 * Lets users upload a PDF and add page numbers with customizable
 * position, starting number, and font size.
 */

"use client";

import { useCallback, useState } from "react";

import { Hash } from "lucide-react";

import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { ProgressBar } from "@/components/tools/ProgressBar";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { useFileProcessor } from "@/hooks/useFileProcessor";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Page number position options */
type PageNumberPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

/** Available positions with labels for display */
const POSITION_OPTIONS: { value: PageNumberPosition; label: string }[] = [
  { value: "top-left", label: "Top left" },
  { value: "top-center", label: "Top center" },
  { value: "top-right", label: "Top right" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "bottom-center", label: "Bottom center" },
  { value: "bottom-right", label: "Bottom right" },
];

/**
 * Visual grid selector for page number position.
 * Displays a 3x2 grid representing the page layout.
 */
function PositionGrid({
  value,
  onChange,
}: {
  value: PageNumberPosition;
  onChange: (pos: PageNumberPosition) => void;
}) {
  const positions: PageNumberPosition[][] = [
    ["top-left", "top-center", "top-right"],
    ["bottom-left", "bottom-center", "bottom-right"],
  ];

  return (
    <div
      className="grid grid-rows-2 gap-1 rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
      role="radiogroup"
      aria-label="Page number position"
    >
      {/* Top row label */}
      <div className="grid grid-cols-3 gap-1">
        {positions[0].map((pos) => (
          <button
            key={pos}
            type="button"
            role="radio"
            aria-checked={value === pos}
            onClick={() => onChange(pos)}
            className={cn(
              "rounded px-2 py-1.5 text-xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500",
              value === pos
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            )}
          >
            {pos.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")}
          </button>
        ))}
      </div>

      {/* Page body placeholder */}
      <div className="grid grid-cols-3 gap-1">
        {positions[1].map((pos) => (
          <button
            key={pos}
            type="button"
            role="radio"
            aria-checked={value === pos}
            onClick={() => onChange(pos)}
            className={cn(
              "rounded px-2 py-1.5 text-xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500",
              value === pos
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            )}
          >
            {pos.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * AddPageNumbersPage provides a simple form for adding page numbers
 * to a PDF with position, starting number, and font size options.
 */
export default function AddPageNumbersPage() {
  const [file, setFile] = useState<File | null>(null);
  const [position, setPosition] = useState<PageNumberPosition>("bottom-center");
  const [startNumber, setStartNumber] = useState(1);
  const [fontSize, setFontSize] = useState(12);

  const { processFile, job, isProcessing, reset } = useFileProcessor({
    endpoint: "/edit/add-page-numbers",
  });

  const handleFileSelect = useCallback((selected: File) => {
    setFile(selected);
  }, []);

  const handleFileRemove = useCallback(() => {
    setFile(null);
    reset();
  }, [reset]);

  /** Submits the page numbers request with configured options */
  const handleProcess = useCallback(() => {
    if (!file) return;

    processFile(file, {
      position,
      start_number: String(startNumber),
      font_size: String(fontSize),
    });
  }, [file, position, startNumber, fontSize, processFile]);

  const showOptions = file && !isProcessing && !job?.downloadUrl;

  return (
    <ToolPageLayout
      title="Add Page Numbers"
      description="Add customizable page numbers to your PDF documents"
      category="edit"
      icon={Hash}
    >
      <FileUploader
        acceptedTypes={ACCEPTED_FILE_TYPES.PDF}
        maxFileSize={MAX_FILE_SIZE.ANONYMOUS}
        onFileSelect={handleFileSelect}
        onFileRemove={handleFileRemove}
        disabled={isProcessing}
      />

      {/* Page number options */}
      {showOptions && (
        <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Page number settings
          </h2>

          {/* Position selector */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Position
            </label>
            <PositionGrid value={position} onChange={setPosition} />
          </div>

          {/* Starting number and font size */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="pn-start"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Starting number
              </label>
              <input
                id="pn-start"
                type="number"
                min={0}
                max={9999}
                value={startNumber}
                onChange={(e) => setStartNumber(Number(e.target.value))}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="pn-font-size"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Font size
              </label>
              <input
                id="pn-font-size"
                type="number"
                min={6}
                max={36}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          {/* Process button */}
          <button
            type="button"
            onClick={handleProcess}
            className={cn(
              "w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors",
              "bg-purple-600 hover:bg-purple-700"
            )}
          >
            Add page numbers
          </button>
        </div>
      )}

      {/* Progress indicator */}
      {job && (
        <ProgressBar
          progress={job.progress}
          statusMessage={
            job.status === "uploading"
              ? "Uploading..."
              : job.status === "processing"
                ? "Adding page numbers..."
                : job.status === "completed"
                  ? "Page numbers added"
                  : "Failed to add page numbers"
          }
          isComplete={job.status === "completed"}
          isError={job.status === "failed"}
          errorMessage={job.errorMessage}
        />
      )}

      {/* Download button */}
      {job?.status === "completed" && job.downloadUrl && (
        <div className="flex justify-center">
          <DownloadButton
            downloadUrl={job.downloadUrl}
            fileName={
              file?.name.replace(/\.pdf$/i, "-numbered.pdf") ??
              "numbered.pdf"
            }
          />
        </div>
      )}
    </ToolPageLayout>
  );
}
