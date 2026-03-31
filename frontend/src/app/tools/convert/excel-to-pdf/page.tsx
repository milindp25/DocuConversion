/**
 * Excel to PDF conversion tool page.
 * Converts Excel spreadsheets (.xls, .xlsx) to PDF format.
 */

"use client";

import { useCallback, useState } from "react";

import { FileSpreadsheet } from "lucide-react";

import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { ProgressBar } from "@/components/tools/ProgressBar";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { useFileProcessor } from "@/hooks/useFileProcessor";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from "@/lib/constants";

export default function ExcelToPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const { processFile, job, isProcessing, reset } = useFileProcessor({
    endpoint: "/convert/excel-to-pdf",
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
      title="Excel to PDF"
      description="Convert Excel spreadsheets to PDF format"
      category="convert"
      icon={FileSpreadsheet}
    >
      <FileUploader
        acceptedTypes={ACCEPTED_FILE_TYPES.EXCEL}
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
            fileName={file?.name.replace(/\.(xls|xlsx)$/i, ".pdf") ?? "spreadsheet.pdf"}
          />
        </div>
      )}
    </ToolPageLayout>
  );
}
