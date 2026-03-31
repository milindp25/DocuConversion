/**
 * PowerPoint to PDF conversion tool page.
 * Converts PowerPoint presentations (.ppt, .pptx) to PDF format.
 */

"use client";

import { useCallback, useState } from "react";

import { Presentation } from "lucide-react";

import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { ProgressBar } from "@/components/tools/ProgressBar";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { useFileProcessor } from "@/hooks/useFileProcessor";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from "@/lib/constants";

export default function PptxToPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const { processFile, job, isProcessing, reset } = useFileProcessor({
    endpoint: "/convert/pptx-to-pdf",
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
      title="PowerPoint to PDF"
      description="Convert PowerPoint presentations to PDF format"
      category="convert"
      icon={Presentation}
    >
      <FileUploader
        acceptedTypes={ACCEPTED_FILE_TYPES.POWERPOINT}
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
            fileName={file?.name.replace(/\.(ppt|pptx)$/i, ".pdf") ?? "presentation.pdf"}
          />
        </div>
      )}
    </ToolPageLayout>
  );
}
