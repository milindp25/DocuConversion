/**
 * Add Watermark tool page.
 * Lets users upload a PDF and add a text watermark with customizable
 * opacity, position, rotation, font size, and color.
 */

"use client";

import { useCallback, useState } from "react";

import { Droplets } from "lucide-react";

import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { ProgressBar } from "@/components/tools/ProgressBar";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { useFileProcessor } from "@/hooks/useFileProcessor";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Watermark position options */
type WatermarkPosition =
  | "center"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

/** Available position choices for the dropdown */
const POSITION_OPTIONS: { value: WatermarkPosition; label: string }[] = [
  { value: "center", label: "Center" },
  { value: "top-left", label: "Top left" },
  { value: "top-right", label: "Top right" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "bottom-right", label: "Bottom right" },
];

/**
 * AddWatermarkPage provides a form-based interface for adding a text
 * watermark to a PDF. Users configure watermark text, opacity, position,
 * rotation, font size, and color before processing.
 */
export default function AddWatermarkPage() {
  const [file, setFile] = useState<File | null>(null);
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState(0.3);
  const [position, setPosition] = useState<WatermarkPosition>("center");
  const [rotation, setRotation] = useState(45);
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState("#808080");

  const { processFile, job, isProcessing, reset } = useFileProcessor({
    endpoint: "/edit/add-watermark",
  });

  const handleFileSelect = useCallback((selected: File) => {
    setFile(selected);
  }, []);

  const handleFileRemove = useCallback(() => {
    setFile(null);
    reset();
  }, [reset]);

  /** Submits the watermark request with all configured options */
  const handleProcess = useCallback(() => {
    if (!file || !watermarkText.trim()) return;

    processFile(file, {
      watermark_text: watermarkText.trim(),
      opacity: String(opacity),
      position,
      rotation: String(rotation),
      font_size: String(fontSize),
      color,
    });
  }, [file, watermarkText, opacity, position, rotation, fontSize, color, processFile]);

  const showOptions = file && !isProcessing && !job?.downloadUrl;

  return (
    <ToolPageLayout
      title="Add Watermark"
      description="Add a customizable text watermark to your PDF documents"
      category="edit"
      icon={Droplets}
    >
      <FileUploader
        acceptedTypes={ACCEPTED_FILE_TYPES.PDF}
        maxFileSize={MAX_FILE_SIZE.ANONYMOUS}
        onFileSelect={handleFileSelect}
        onFileRemove={handleFileRemove}
        disabled={isProcessing}
      />

      {/* Watermark options */}
      {showOptions && (
        <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Watermark settings
          </h2>

          {/* Text input */}
          <div>
            <label
              htmlFor="watermark-text"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Watermark text
            </label>
            <input
              id="watermark-text"
              type="text"
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              placeholder="Enter watermark text..."
              required
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            />
          </div>

          {/* Opacity slider */}
          <div>
            <label
              htmlFor="watermark-opacity"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Opacity ({Math.round(opacity * 100)}%)
            </label>
            <input
              id="watermark-opacity"
              type="range"
              min={0.05}
              max={1}
              step={0.05}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Position and rotation row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="watermark-position"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Position
              </label>
              <select
                id="watermark-position"
                value={position}
                onChange={(e) =>
                  setPosition(e.target.value as WatermarkPosition)
                }
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                {POSITION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="watermark-rotation"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Rotation ({rotation} degrees)
              </label>
              <input
                id="watermark-rotation"
                type="range"
                min={-180}
                max={180}
                step={5}
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* Font size and color row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="watermark-font-size"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Font size
              </label>
              <input
                id="watermark-font-size"
                type="number"
                min={8}
                max={200}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="watermark-color"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Color
              </label>
              <input
                id="watermark-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-full cursor-pointer rounded-md border border-gray-300 dark:border-gray-600"
              />
            </div>
          </div>

          {/* Preview text */}
          <div className="flex items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 py-8 dark:border-gray-600 dark:bg-gray-800">
            <span
              className="select-none text-center font-semibold"
              style={{
                color,
                opacity,
                fontSize: `${Math.min(fontSize, 40)}px`,
                transform: `rotate(${rotation}deg)`,
              }}
            >
              {watermarkText || "Preview"}
            </span>
          </div>

          {/* Process button */}
          <button
            type="button"
            onClick={handleProcess}
            disabled={!watermarkText.trim()}
            className={cn(
              "w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors",
              "bg-purple-600 hover:bg-purple-700",
              "disabled:pointer-events-none disabled:opacity-50"
            )}
          >
            Add watermark
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
                ? "Adding watermark..."
                : job.status === "completed"
                  ? "Watermark added"
                  : "Failed to add watermark"
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
              file?.name.replace(/\.pdf$/i, "-watermarked.pdf") ??
              "watermarked.pdf"
            }
          />
        </div>
      )}
    </ToolPageLayout>
  );
}
