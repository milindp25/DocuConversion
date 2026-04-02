/**
 * Summarize PDF tool page.
 * Allows users to upload a PDF and generate an AI summary
 * with configurable length (short, medium, detailed).
 */

"use client";

import { useCallback, useState } from "react";

import { Sparkles, Loader2 } from "lucide-react";

import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { SummaryResult } from "@/components/ai/SummaryResult";
import { useAiProcessor } from "@/hooks/useAiProcessor";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Response shape from the summarize endpoint */
interface SummarizeResponse {
  summary: string;
  page_count: number;
}

/** Available summary length options */
const LENGTH_OPTIONS = [
  { value: "short", label: "Short", description: "1-2 paragraphs" },
  { value: "medium", label: "Medium", description: "3-5 paragraphs" },
  { value: "detailed", label: "Detailed", description: "Comprehensive" },
] as const;

export default function SummarizePdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [length, setLength] = useState<string>("medium");
  const { processFile, result, isProcessing, error, reset } =
    useAiProcessor<SummarizeResponse>({
      endpoint: "/ai/summarize",
    });

  const handleFileSelect = useCallback((selected: File) => {
    setFile(selected);
  }, []);

  const handleFileRemove = useCallback(() => {
    setFile(null);
    reset();
  }, [reset]);

  const handleSummarize = useCallback(async () => {
    if (!file) return;
    await processFile(file, { length });
  }, [file, length, processFile]);

  return (
    <ToolPageLayout
      title="Summarize PDF"
      description="Get an AI-generated summary of any PDF document."
      category="ai"
      icon={Sparkles}
    >
      <FileUploader
        acceptedTypes={ACCEPTED_FILE_TYPES.PDF}
        maxFileSize={MAX_FILE_SIZE.ANONYMOUS}
        onFileSelect={handleFileSelect}
        onFileRemove={handleFileRemove}
        disabled={isProcessing}
      />

      {/* Length selector — shown after file upload */}
      {file && !result && (
        <div className="space-y-4">
          <fieldset>
            <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Summary length
            </legend>
            <div className="mt-2 flex gap-3" role="radiogroup" aria-label="Summary length">
              {LENGTH_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex flex-1 cursor-pointer flex-col items-center rounded-lg border px-4 py-3 text-center transition-all duration-200",
                    "focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2",
                    length === option.value
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-950 dark:text-indigo-300"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:border-gray-600"
                  )}
                >
                  <input
                    type="radio"
                    name="summary-length"
                    value={option.value}
                    checked={length === option.value}
                    onChange={() => setLength(option.value)}
                    className="sr-only"
                    aria-label={`${option.label} summary — ${option.description}`}
                  />
                  <span className="text-sm font-semibold">{option.label}</span>
                  <span className="mt-0.5 text-xs opacity-70">{option.description}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="button"
            onClick={handleSummarize}
            disabled={isProcessing}
            aria-label="Summarize the uploaded PDF"
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200",
              "hover:bg-indigo-500 hover:shadow-xl hover:shadow-indigo-500/30",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-60"
            )}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Summarizing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Summarize
              </>
            )}
          </button>

          {/* Subtle hint while AI is processing */}
          {isProcessing && (
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 animate-pulse">
              This may take a few seconds
            </p>
          )}
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
        <SummaryResult
          summary={result.summary}
          pageCount={result.page_count}
          length={length}
        />
      )}
    </ToolPageLayout>
  );
}
