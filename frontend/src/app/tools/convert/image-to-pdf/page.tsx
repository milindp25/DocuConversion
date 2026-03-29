/**
 * Image to PDF conversion tool page.
 * Converts image files (PNG, JPG, GIF, BMP, WebP) to PDF format.
 */

"use client";

import { useCallback, useState } from "react";

import { Image } from "lucide-react";

import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { ProgressBar } from "@/components/tools/ProgressBar";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { useFileProcessor } from "@/hooks/useFileProcessor";
import { MAX_FILE_SIZE } from "@/lib/constants";

const ACCEPTED_IMAGE_TYPES = [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"];

export default function ImageToPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const { processFile, job, isProcessing, reset } = useFileProcessor({
    endpoint: "/convert/image-to-pdf",
  });

  const handleFileSelect = useCallback(
    (selected: File) => {
      setFile(selected);
      processFile(selected);
    },
    [processFile]
  );

  const handleFileRemove = useCallback(() => {
    setFile(null);
    reset();
  }, [reset]);

  return (
    <ToolPageLayout
      title="Image to PDF"
      description="Convert image files to PDF format"
      category="convert"
      icon={Image}
    >
      <FileUploader
        acceptedTypes={ACCEPTED_IMAGE_TYPES}
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
                ? "Converting to PDF..."
                : job.status === "completed"
                  ? "Conversion complete"
                  : "Conversion failed"
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
              file?.name.replace(/\.[^.]+$/, ".pdf") ?? "image.pdf"
            }
          />
        </div>
      )}
    </ToolPageLayout>
  );
}
