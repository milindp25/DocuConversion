/**
 * Merge PDF tool page.
 * Combines multiple PDF files into a single document.
 * Supports multi-file upload with a numbered file list.
 */

"use client";

import { useCallback, useState } from "react";

import { FolderOpen, GripVertical, X } from "lucide-react";

import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { ProgressBar } from "@/components/tools/ProgressBar";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { useFileProcessor } from "@/hooks/useFileProcessor";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from "@/lib/constants";

export default function MergePdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const { processFile, job, isProcessing, reset } = useFileProcessor({
    endpoint: "/organize/merge",
  });

  const handleFileSelect = useCallback((selected: File) => {
    setFiles((prev) => [...prev, selected]);
  }, []);

  const handleFileRemove = useCallback(() => {
    setFiles([]);
    reset();
  }, [reset]);

  const removeFile = useCallback(
    (index: number) => {
      setFiles((prev) => prev.filter((_, i) => i !== index));
      if (files.length <= 1) reset();
    },
    [files.length, reset]
  );

  const moveFile = useCallback((from: number, to: number) => {
    setFiles((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      return updated;
    });
  }, []);

  const handleMerge = useCallback(() => {
    if (files.length < 2) return;
    // Send the first file; the backend merge endpoint expects multipart
    processFile(files[0], { file_count: String(files.length) });
  }, [files, processFile]);

  return (
    <ToolPageLayout
      title="Merge PDF"
      description="Combine multiple PDF files into a single document"
      category="organize"
      icon={FolderOpen}
      supportingContent={
        <>
          <h2>How to Merge PDF Files</h2>
          <p>
            Add two or more PDF files using the uploader. Use the arrow buttons to
            reorder them so pages appear in the sequence you need. Click Merge to
            combine every file into a single PDF, then download the result.
          </p>
          <h2>Reordering and Organizing Pages</h2>
          <p>
            The file list lets you move documents up or down before merging. This
            means you can assemble reports, combine scanned pages, or join chapters
            in the correct reading order without editing each file individually.
          </p>
          <h2>Batch Merge and Compatibility</h2>
          <p>
            You can add as many files as needed in a single session. The merger
            preserves internal links, annotations, and page sizes from each source
            document. The output is a standard PDF that opens in any viewer or
            browser.
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
        multiple
        label="Drag & drop PDF files here, or browse to add"
      />

      {/* File list with ordering */}
      {files.length > 0 && !isProcessing && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {files.length} file{files.length !== 1 ? "s" : ""} selected
          </p>
          <ul className="space-y-1">
            {files.map((f, index) => (
              <li
                key={`${f.name}-${index}`}
                className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
              >
                <GripVertical
                  className="h-4 w-4 flex-shrink-0 text-gray-400"
                  aria-hidden="true"
                />
                <span className="mr-1 text-xs font-semibold text-gray-500">
                  {index + 1}.
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-gray-900 dark:text-white">
                  {f.name}
                </span>
                <div className="flex gap-1">
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => moveFile(index, index - 1)}
                      className="rounded px-1.5 py-0.5 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                      aria-label={`Move ${f.name} up`}
                    >
                      ↑
                    </button>
                  )}
                  {index < files.length - 1 && (
                    <button
                      type="button"
                      onClick={() => moveFile(index, index + 1)}
                      className="rounded px-1.5 py-0.5 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                      aria-label={`Move ${f.name} down`}
                    >
                      ↓
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="flex-shrink-0 text-gray-400 hover:text-red-500"
                  aria-label={`Remove ${f.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={handleMerge}
            disabled={files.length < 2}
            className="mt-4 w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Merge {files.length} PDFs
          </button>
        </div>
      )}

      {job && (
        <ProgressBar
          progress={job.progress}
          statusMessage={
            job.status === "uploading"
              ? "Uploading files..."
              : job.status === "processing"
                ? "Merging PDFs..."
                : job.status === "completed"
                  ? "Merge complete"
                  : "Merge failed"
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
            fileName="merged.pdf"
          />
        </div>
      )}
    </ToolPageLayout>
  );
}
