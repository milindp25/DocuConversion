/**
 * Download button displayed after successful file processing.
 * Triggers a browser download of the processed file and shows
 * the filename and size for user confirmation.
 */

"use client";

import { Download, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/format";

/** Props for the DownloadButton component */
export interface DownloadButtonProps {
  /** URL to download the processed file */
  downloadUrl: string;
  /** Suggested filename for the download */
  fileName: string;
  /** File size of the result (for display) */
  fileSize?: number;
}

/**
 * DownloadButton renders a prominent call-to-action button for downloading
 * the processed file. Displays the filename and optional file size.
 *
 * @example
 * ```tsx
 * <DownloadButton
 *   downloadUrl="/api/pdf/download/abc123"
 *   fileName="document.docx"
 *   fileSize={1048576}
 * />
 * ```
 */
export function DownloadButton({
  downloadUrl,
  fileName,
  fileSize,
}: DownloadButtonProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* Download ready label */}
      <div className="flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        <span>Download ready</span>
      </div>

      {/* Download button with shine animation */}
      <a
        href={downloadUrl}
        download={fileName}
        className={cn(
          "btn-shine inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-4 text-white shadow-lg shadow-blue-500/25 transition-all duration-200",
          "hover:from-blue-700 hover:to-blue-600 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
          "active:translate-y-0 active:shadow-md"
        )}
        aria-label={`Download ${fileName}`}
      >
        <CheckCircle2 className="h-5 w-5 text-blue-200" aria-hidden="true" />

        <div className="text-left">
          <p className="text-base font-bold leading-tight">{fileName}</p>
          {fileSize != null && fileSize > 0 && (
            <p className="text-sm font-medium text-blue-200">
              {formatFileSize(fileSize)}
            </p>
          )}
        </div>

        <Download className="h-5 w-5 ml-1" aria-hidden="true" />
      </a>
    </div>
  );
}
