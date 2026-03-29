/**
 * Unlock PDF tool page.
 * Removes password protection from PDF documents.
 * Includes a password input field for the current document password.
 */

"use client";

import { useCallback, useState } from "react";

import { Unlock, Eye, EyeOff } from "lucide-react";

import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { ProgressBar } from "@/components/tools/ProgressBar";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { useFileProcessor } from "@/hooks/useFileProcessor";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from "@/lib/constants";

export default function UnlockPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { processFile, job, isProcessing, reset } = useFileProcessor({
    endpoint: "/secure/unlock",
  });

  const handleFileSelect = useCallback((selected: File) => {
    setFile(selected);
  }, []);

  const handleFileRemove = useCallback(() => {
    setFile(null);
    setPassword("");
    reset();
  }, [reset]);

  const handleUnlock = useCallback(() => {
    if (!file || !password) return;
    processFile(file, { password });
  }, [file, password, processFile]);

  return (
    <ToolPageLayout
      title="Unlock PDF"
      description="Remove password protection from a PDF"
      category="secure"
      icon={Unlock}
    >
      <FileUploader
        acceptedTypes={ACCEPTED_FILE_TYPES.PDF}
        maxFileSize={MAX_FILE_SIZE.ANONYMOUS}
        onFileSelect={handleFileSelect}
        onFileRemove={handleFileRemove}
        disabled={isProcessing}
      />

      {/* Password input for current password */}
      {file && !isProcessing && !job?.downloadUrl && (
        <div className="space-y-4">
          <div>
            <label
              htmlFor="unlock-password"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Current password
            </label>
            <div className="relative">
              <input
                id="unlock-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter the PDF password"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleUnlock}
            disabled={!password}
            className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Unlock PDF
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
                ? "Removing protection..."
                : job.status === "completed"
                  ? "PDF unlocked"
                  : "Unlock failed"
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
              file?.name.replace(/\.pdf$/i, "-unlocked.pdf") ?? "unlocked.pdf"
            }
          />
        </div>
      )}
    </ToolPageLayout>
  );
}
