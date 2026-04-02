/**
 * Typed signature generator component.
 * Lets users type their name and select a font style,
 * then sends the text to the backend to generate a signature PNG.
 */

"use client";

import React, { useCallback, useState } from "react";

import { Type, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/api-client";

/** Props for the TypeSignature component */
export interface TypeSignatureProps {
  /** Callback invoked with the signature image data URL when generated */
  onSignatureReady: (dataUrl: string) => void;
}

/** Available font styles for typed signatures */
type FontStyle = "cursive" | "formal" | "casual";

/** Font style configuration for preview rendering */
const FONT_STYLE_CONFIG: Record<FontStyle, { label: string; className: string }> = {
  cursive: { label: "Cursive", className: "italic font-serif" },
  formal: { label: "Formal", className: "font-serif tracking-wide" },
  casual: { label: "Casual", className: "font-sans" },
};

/** Backend response for signature generation (ProcessingResponse) */
interface GenerateSignatureResponse {
  job_id: string;
  status: string;
  message: string;
}

/** Backend response for job status polling */
interface JobStatusResponse {
  job_id: string;
  status: string;
  progress: number;
  download_url?: string;
}

/**
 * TypeSignature allows users to type their name, pick a font style,
 * and generate a PNG signature image via the backend API.
 *
 * @example
 * ```tsx
 * <TypeSignature
 *   onSignatureReady={(dataUrl) => setSignature(dataUrl)}
 * />
 * ```
 */
export function TypeSignature({ onSignatureReady }: TypeSignatureProps) {
  const [text, setText] = useState("");
  const [fontStyle, setFontStyle] = useState<FontStyle>("cursive");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Sends the typed text to the backend and retrieves the generated image */
  const handleGenerate = useCallback(async () => {
    if (!text.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      // Backend expects Form data, not JSON
      const formData = new FormData();
      formData.append("text", text.trim());
      formData.append("font_style", fontStyle);

      const response = await apiRequest<GenerateSignatureResponse>(
        "/sign/generate-signature",
        {
          method: "POST",
          body: formData,
        }
      );

      // The backend processes synchronously but returns ProcessingResponse
      // without download_url. Poll job status to get the download URL.
      const jobStatus = await apiRequest<JobStatusResponse>(
        `/jobs/status/${response.job_id}`
      );

      if (!jobStatus.download_url) {
        throw new Error("Signature generated but download URL is not available");
      }

      // Fetch via the download proxy (avoids cross-origin CORS restrictions
      // when the storage URL is on a different host than the frontend).
      const proxyUrl = `/api/download?url=${encodeURIComponent(jobStatus.download_url)}&filename=signature.png`;
      const imageResponse = await fetch(proxyUrl);
      if (!imageResponse.ok) {
        throw new Error("Failed to retrieve generated signature image");
      }
      const blob = await imageResponse.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        onSignatureReady(dataUrl);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate signature"
      );
    } finally {
      setIsGenerating(false);
    }
  }, [text, fontStyle, onSignatureReady]);

  return (
    <div className="flex flex-col gap-4">
      {/* Text input */}
      <div>
        <label
          htmlFor="signature-text"
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Your name
        </label>
        <input
          id="signature-text"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your full name"
          maxLength={80}
          aria-label="Type your name for signature"
          className={cn(
            "w-full rounded-lg border px-4 py-2.5 text-sm transition-colors",
            "border-gray-300 bg-white text-gray-900 placeholder-gray-400",
            "dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500",
            "focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          )}
        />
      </div>

      {/* Font style selector */}
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
          Font style
        </legend>
        <div className="flex gap-2">
          {(Object.entries(FONT_STYLE_CONFIG) as [FontStyle, typeof FONT_STYLE_CONFIG[FontStyle]][]).map(
            ([key, config]) => (
              <label
                key={key}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                  "focus-within:ring-2 focus-within:ring-orange-500",
                  fontStyle === key
                    ? "border-orange-500 bg-orange-50 text-orange-700 dark:border-orange-500 dark:bg-orange-950 dark:text-orange-300"
                    : "border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500"
                )}
              >
                <input
                  type="radio"
                  name="font-style"
                  value={key}
                  checked={fontStyle === key}
                  onChange={() => setFontStyle(key)}
                  className="sr-only"
                  aria-label={`${config.label} font style`}
                />
                {config.label}
              </label>
            )
          )}
        </div>
      </fieldset>

      {/* Preview */}
      {text.trim() && (
        <div
          className={cn(
            "rounded-lg border border-dashed border-gray-300 bg-white p-4 text-center dark:border-gray-600",
          )}
          aria-label="Signature preview"
        >
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Preview</p>
          <p
            className={cn(
              "text-2xl text-gray-900",
              FONT_STYLE_CONFIG[fontStyle].className
            )}
          >
            {text}
          </p>
        </div>
      )}

      {/* Generate button */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={!text.trim() || isGenerating}
        aria-label="Generate typed signature"
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors",
          "bg-orange-600 hover:bg-orange-700",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
        )}
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Generating...
          </>
        ) : (
          <>
            <Type className="h-4 w-4" aria-hidden="true" />
            Generate Signature
          </>
        )}
      </button>

      {/* Error message */}
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
