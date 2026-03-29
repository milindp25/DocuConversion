/**
 * Sign PDF tool page.
 * Adds electronic signatures to PDF documents.
 * Currently shows a placeholder for the signature editor.
 */

"use client";

import { useCallback, useState } from "react";

import { PenTool } from "lucide-react";

import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from "@/lib/constants";

export default function SignPdfPage() {
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = useCallback((selected: File) => {
    setFile(selected);
  }, []);

  const handleFileRemove = useCallback(() => {
    setFile(null);
  }, []);

  return (
    <ToolPageLayout
      title="Sign PDF"
      description="Add your electronic signature to any PDF document"
      category="sign"
      icon={PenTool}
    >
      <FileUploader
        acceptedTypes={ACCEPTED_FILE_TYPES.PDF}
        maxFileSize={MAX_FILE_SIZE.ANONYMOUS}
        onFileSelect={handleFileSelect}
        onFileRemove={handleFileRemove}
      />

      {file && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-6 text-center dark:border-orange-800 dark:bg-orange-950">
          <PenTool
            className="mx-auto mb-3 h-8 w-8 text-orange-500"
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
            Signature editor coming soon
          </p>
          <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">
            Upload your PDF to get started. The signature editor is under
            development.
          </p>
        </div>
      )}
    </ToolPageLayout>
  );
}
