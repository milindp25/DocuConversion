/**
 * Signature image upload component.
 * Allows users to upload an existing signature image (PNG/JPG)
 * and preview it before applying to a PDF.
 */

"use client";

import React, { useCallback, useRef, useState } from "react";

import { Upload, X, ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/format";

/** Props for the UploadSignature component */
export interface UploadSignatureProps {
  /** Callback invoked with the signature image data URL when a file is selected */
  onSignatureReady: (dataUrl: string) => void;
}

/** Maximum signature image size: 5 MB */
const MAX_SIGNATURE_SIZE = 5 * 1024 * 1024;

/** Accepted image types for signature upload */
const ACCEPTED_TYPES = [".png", ".jpg", ".jpeg"];

/**
 * UploadSignature provides a file input for users to upload an
 * existing signature image. Shows a preview and converts the
 * image to a data URL for use in the signing flow.
 *
 * @example
 * ```tsx
 * <UploadSignature
 *   onSignatureReady={(dataUrl) => setSignature(dataUrl)}
 * />
 * ```
 */
export function UploadSignature({ onSignatureReady }: UploadSignatureProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /** Validates and processes the selected image file */
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setError(null);

      // Validate type
      const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
      if (!ACCEPTED_TYPES.includes(ext)) {
        setError("Please upload a PNG or JPG image.");
        return;
      }

      // Validate size
      if (file.size > MAX_SIGNATURE_SIZE) {
        setError(
          `Image is too large (${formatFileSize(file.size)}). Maximum is ${formatFileSize(MAX_SIGNATURE_SIZE)}.`
        );
        return;
      }

      setFileName(file.name);
      setFileSize(file.size);

      // Read as data URL for preview and submission
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setPreview(dataUrl);
        onSignatureReady(dataUrl);
      };
      reader.readAsDataURL(file);

      // Reset input so same file can be re-selected
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [onSignatureReady]
  );

  /** Clears the selected image */
  const handleRemove = useCallback(() => {
    setPreview(null);
    setFileName(null);
    setFileSize(0);
    setError(null);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      {!preview ? (
        <>
          {/* Upload zone */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            aria-label="Upload signature image file"
            className={cn(
              "flex w-full max-w-[300px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors",
              "border-gray-300 hover:border-orange-400 hover:bg-orange-50/50",
              "dark:border-gray-600 dark:hover:border-orange-500 dark:hover:bg-orange-950/30",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            )}
          >
            <Upload
              className="h-8 w-8 text-gray-400 dark:text-gray-500"
              aria-hidden="true"
            />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Upload signature image
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              PNG or JPG, up to {formatFileSize(MAX_SIGNATURE_SIZE)}
            </span>
          </button>

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            onChange={handleFileChange}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />
        </>
      ) : (
        /* Preview of the uploaded image */
        <div className="flex w-full max-w-[300px] flex-col items-center gap-2">
          <div className="relative rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Uploaded signature preview"
              className="max-h-[120px] max-w-[260px] object-contain"
            />
            <button
              type="button"
              onClick={handleRemove}
              aria-label="Remove uploaded signature"
              className={cn(
                "absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full",
                "bg-red-500 text-white shadow-sm hover:bg-red-600 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              )}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          {fileName && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="truncate max-w-[200px]">{fileName}</span>
              <span>({formatFileSize(fileSize)})</span>
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
