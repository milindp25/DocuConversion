/**
 * Drag-and-drop file upload component for DocuConversion tool pages.
 * This is the primary interaction point for every tool — users either
 * drag a file onto the zone or click to browse. Handles validation
 * for file type and size, and provides accessible keyboard navigation.
 */

"use client";

import React, { useCallback, useRef, useState } from "react";

import { Upload, X, FileIcon, AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/format";

/** Props for the FileUploader component */
export interface FileUploaderProps {
  /** File extensions to accept (e.g., [".pdf", ".docx"]) */
  acceptedTypes: readonly string[];
  /** Maximum file size in bytes */
  maxFileSize: number;
  /** Callback when a valid file is selected */
  onFileSelect: (file: File) => void;
  /** Callback when the file is removed */
  onFileRemove: () => void;
  /** Whether uploads are disabled (e.g., during processing) */
  disabled?: boolean;
  /** Whether to allow multiple files (for merge tool) */
  multiple?: boolean;
  /** Custom label for the upload zone */
  label?: string;
}

/**
 * Validates a file against accepted types and size constraints.
 * Returns an error message string, or null if the file is valid.
 */
function validateFile(
  file: File,
  acceptedTypes: readonly string[],
  maxFileSize: number
): string | null {
  const fileName = file.name.toLowerCase();
  const hasValidExtension = acceptedTypes.some((ext) =>
    fileName.endsWith(ext.toLowerCase())
  );

  if (!hasValidExtension) {
    const formattedTypes = acceptedTypes
      .map((t) => t.toUpperCase().replace(".", ""))
      .join(", ");
    return `Invalid file type. Accepted types: ${formattedTypes}`;
  }

  if (file.size > maxFileSize) {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    const maxSizeMB = (maxFileSize / (1024 * 1024)).toFixed(0);
    return `File is too large (${fileSizeMB} MB). Maximum for free tier is ${maxSizeMB} MB. Sign up for a free account to upload up to 25 MB, or upgrade to Pro for 100 MB.`;
  }

  if (file.size === 0) {
    return "File is empty. Please select a valid file.";
  }

  return null;
}

/**
 * FileUploader provides a drag-and-drop zone with click-to-browse fallback
 * for selecting files to process. Validates file type and size before
 * notifying the parent via `onFileSelect`.
 *
 * @example
 * ```tsx
 * <FileUploader
 *   acceptedTypes={[".pdf"]}
 *   maxFileSize={10 * 1024 * 1024}
 *   onFileSelect={(file) => console.log(file.name)}
 *   onFileRemove={() => console.log("removed")}
 * />
 * ```
 */
export function FileUploader({
  acceptedTypes,
  maxFileSize,
  onFileSelect,
  onFileRemove,
  disabled = false,
  multiple = false,
  label,
}: FileUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /** Builds the accept string for the native file input */
  const acceptString = acceptedTypes.join(",");

  /** Friendly label for accepted types (e.g., "PDF, DOCX") */
  const acceptedTypesLabel = acceptedTypes
    .map((t) => t.toUpperCase().replace(".", ""))
    .join(", ");

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      setError(null);

      if (multiple) {
        const validFiles: File[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const validationError = validateFile(file, acceptedTypes, maxFileSize);
          if (validationError) {
            setError(`${file.name}: ${validationError}`);
            return;
          }
          validFiles.push(file);
        }
        setSelectedFiles(validFiles);
        // Notify parent with the first file (multi-file handling can be extended)
        if (validFiles.length > 0) {
          onFileSelect(validFiles[0]);
        }
      } else {
        const file = files[0];
        const validationError = validateFile(file, acceptedTypes, maxFileSize);
        if (validationError) {
          setError(validationError);
          return;
        }
        setSelectedFiles([file]);
        onFileSelect(file);
      }
    },
    [acceptedTypes, maxFileSize, multiple, onFileSelect]
  );

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragActive(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragActive(true);
      }
    },
    [disabled]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      if (disabled) return;

      handleFiles(e.dataTransfer.files);
    },
    [disabled, handleFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      // Reset the input so the same file can be re-selected
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [handleFiles]
  );

  const handleBrowseClick = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click();
    }
  }, [disabled]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.key === "Enter" || e.key === " ") && !disabled) {
        e.preventDefault();
        inputRef.current?.click();
      }
    },
    [disabled]
  );

  const handleRemove = useCallback(() => {
    setSelectedFiles([]);
    setError(null);
    onFileRemove();
  }, [onFileRemove]);

  const hasFile = selectedFiles.length > 0;

  return (
    <div className="w-full">
      {/* Drop zone — hidden when a file is already selected */}
      {!hasFile && (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={
            label ||
            `Upload ${acceptedTypesLabel} file. Drag and drop or click to browse.`
          }
          aria-disabled={disabled}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
          onKeyDown={handleKeyDown}
          className={cn(
            "upload-zone-pattern relative flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-xl border p-10 text-center transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
            isDragActive && !disabled
              ? "animate-pulse-ring border-blue-400 bg-blue-50/80 shadow-lg shadow-blue-500/10 dark:border-blue-500 dark:bg-blue-950/60"
              : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-md hover:shadow-blue-500/5 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-600",
            disabled &&
              "pointer-events-none cursor-not-allowed opacity-50"
          )}
        >
          {/* Upload icon in a rounded circle */}
          <div
            className={cn(
              "mb-5 flex h-14 w-14 items-center justify-center rounded-full transition-colors duration-200",
              isDragActive
                ? "bg-blue-100 dark:bg-blue-900"
                : "bg-gray-100 dark:bg-gray-800"
            )}
          >
            <Upload
              className={cn(
                "h-6 w-6 transition-colors duration-200",
                isDragActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-400 dark:text-gray-500"
              )}
              aria-hidden="true"
            />
          </div>

          <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            {label || (
              <>
                {isDragActive ? (
                  "Drop your file here"
                ) : (
                  <>
                    Drag & drop your file here, or{" "}
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-0.5 text-sm font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-400/30">
                      browse
                    </span>
                  </>
                )}
              </>
            )}
          </p>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            {acceptedTypesLabel} — up to {formatFileSize(maxFileSize)}
          </p>

          <input
            ref={inputRef}
            type="file"
            accept={acceptString}
            multiple={multiple}
            onChange={handleInputChange}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            disabled={disabled}
          />
        </div>
      )}

      {/* Selected file display */}
      {hasFile && (
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950">
            <FileIcon
              className="h-6 w-6 text-blue-600 dark:text-blue-400"
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-gray-900 dark:text-white">
              {selectedFiles[0].name}
            </p>
            <p className="mt-0.5 text-sm font-medium text-gray-500 dark:text-gray-400">
              {formatFileSize(selectedFiles[0].size)}
              {selectedFiles.length > 1 &&
                ` (+${selectedFiles.length - 1} more)`}
            </p>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            aria-label={`Remove ${selectedFiles[0].name}`}
            className={cn(
              "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-gray-400 transition-all duration-150",
              "hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              disabled && "pointer-events-none opacity-50"
            )}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Validation error */}
      {error && (
        <div
          role="alert"
          className="mt-3 flex items-start gap-2 text-sm text-red-600 dark:text-red-400"
        >
          <AlertCircle
            className="mt-0.5 h-4 w-4 flex-shrink-0"
            aria-hidden="true"
          />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
