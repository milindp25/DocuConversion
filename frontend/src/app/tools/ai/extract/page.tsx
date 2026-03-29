/**
 * Smart Extraction tool page.
 * Uploads a PDF and automatically extracts tables, key-value pairs,
 * and named entities using AI processing.
 */

"use client";

import { useCallback, useState } from "react";

import { FileSearch, Loader2 } from "lucide-react";

import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import {
  ExtractionResult,
  type ExtractedTable,
  type ExtractedKeyValue,
  type ExtractedEntity,
} from "@/components/ai/ExtractionResult";
import { useAiProcessor } from "@/hooks/useAiProcessor";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from "@/lib/constants";

/** Response shape from the extraction endpoint */
interface ExtractionResponse {
  tables: ExtractedTable[];
  key_values: ExtractedKeyValue[];
  entities: ExtractedEntity[];
}

export default function ExtractPage() {
  const [file, setFile] = useState<File | null>(null);
  const { processFile, result, isProcessing, error, reset } =
    useAiProcessor<ExtractionResponse>({
      endpoint: "/ai/extract",
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
      title="Smart Extraction"
      description="Extract tables, key-value pairs, and named entities from your PDF."
      category="ai"
      icon={FileSearch}
    >
      <FileUploader
        acceptedTypes={ACCEPTED_FILE_TYPES.PDF}
        maxFileSize={MAX_FILE_SIZE.ANONYMOUS}
        onFileSelect={handleFileSelect}
        onFileRemove={handleFileRemove}
        disabled={isProcessing}
      />

      {/* Processing indicator */}
      {isProcessing && (
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-indigo-600 dark:text-indigo-400">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>Extracting data from your PDF...</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div role="alert" className="text-center text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <ExtractionResult
          tables={result.tables}
          keyValues={result.key_values}
          entities={result.entities}
        />
      )}
    </ToolPageLayout>
  );
}
