/**
 * PDF to Word conversion tool page.
 * Converts PDF documents to editable Word (.docx) files.
 */

"use client";

import { useCallback, useState } from "react";

import { FileText } from "lucide-react";

import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { ProgressBar } from "@/components/tools/ProgressBar";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { useFileProcessor } from "@/hooks/useFileProcessor";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from "@/lib/constants";

export default function PdfToWordPage() {
  const [file, setFile] = useState<File | null>(null);
  const { processFile, job, isProcessing, reset } = useFileProcessor({
    endpoint: "/convert/pdf-to-word",
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
      title="PDF to Word"
      description="Convert PDF documents to editable Word (.docx) files"
      category="convert"
      icon={FileText}
      supportingContent={
        <>
          <h2>How to Convert PDF to Word</h2>
          <p>
            Upload your PDF file using the uploader above. The converter extracts text,
            images, and formatting from each page and rebuilds them as an editable Word
            document. Once processing finishes, click Download to save your .docx file.
          </p>
          <h2>Why Convert PDF to Word?</h2>
          <p>
            PDFs are designed for viewing, not editing. Converting to Word lets you
            update text, rearrange sections, fix typos, or repurpose content without
            retyping. This is useful for contracts, reports, academic papers, and any
            document that needs revisions.
          </p>
          <h2>Format Support and Quality</h2>
          <p>
            The converter handles standard PDF files including those with tables,
            multi-column layouts, headers, footers, and embedded images. Output files
            are compatible with Microsoft Word, Google Docs, and LibreOffice. Fonts
            and paragraph spacing are preserved as closely as the source allows.
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
      />

      {job && (
        <ProgressBar
          progress={job.progress}
          statusMessage={
            job.status === "uploading"
              ? "Uploading..."
              : job.status === "processing"
                ? "Converting to Word..."
                : job.status === "completed"
                  ? "Conversion complete"
                  : "Conversion failed"
          }
          isComplete={job.status === "completed"}
          isError={job.status === "failed"}
          errorMessage={job.errorMessage}
          onRetry={() => {
            reset();
            setFile(null);
          }}
        />
      )}

      {job?.status === "completed" && job.downloadUrl && (
        <div className="flex justify-center">
          <DownloadButton
            downloadUrl={job.downloadUrl}
            fileName={file?.name.replace(/\.pdf$/i, ".docx") ?? "document.docx"}
            onReset={() => {
              reset();
              setFile(null);
            }}
          />
        </div>
      )}
    </ToolPageLayout>
  );
}
