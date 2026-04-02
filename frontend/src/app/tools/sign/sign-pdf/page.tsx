/**
 * Sign PDF tool page.
 * Allows users to add electronic signatures to PDF documents.
 * Supports drawn, typed, and uploaded signatures with configurable placement.
 *
 * Flow: Upload PDF -> Create Signature -> Place Signature -> Apply & Download
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { PenTool, Pencil, Type, Upload, Loader2, AlertCircle } from "lucide-react";

import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { ProgressBar } from "@/components/tools/ProgressBar";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { SignatureCanvas } from "@/components/sign/SignatureCanvas";
import { TypeSignature } from "@/components/sign/TypeSignature";
import { UploadSignature } from "@/components/sign/UploadSignature";
import {
  SignaturePlacement,
  type SignaturePlacementValue,
} from "@/components/sign/SignaturePlacement";
import { apiRequest } from "@/lib/api-client";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { JobStatus } from "@/types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** Tabs available for creating a signature */
type SignatureTab = "draw" | "type" | "upload";

/** Response from the PDF info endpoint */
interface PdfInfoResponse {
  page_count: number;
}

/** Response when submitting the sign job */
interface SignJobResponse {
  job_id: string;
}

/** Response when polling job status */
interface StatusResponse {
  job_id: string;
  status: JobStatus;
  progress: number;
  download_url?: string;
  error_message?: string;
}

/** Tab configuration for the signature creation UI */
const SIGNATURE_TABS: { key: SignatureTab; label: string; icon: typeof Pencil }[] = [
  { key: "draw", label: "Draw", icon: Pencil },
  { key: "type", label: "Type", icon: Type },
  { key: "upload", label: "Upload", icon: Upload },
];

/** Polling interval in milliseconds */
const POLL_INTERVAL_MS = 2000;

/** Maximum polling duration in milliseconds */
const MAX_POLL_TIME_MS = 120_000;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * SignPdfPage orchestrates the full sign-PDF workflow:
 * 1. Upload a PDF
 * 2. Create a signature (draw, type, or upload)
 * 3. Configure placement (page, position, size)
 * 4. Apply the signature and download the result
 */
export default function SignPdfPage() {
  /* ---- Step 1: PDF upload ---- */
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [pdfInfoLoading, setPdfInfoLoading] = useState(false);
  const [pdfInfoError, setPdfInfoError] = useState<string | null>(null);

  /* ---- Step 2: Signature creation ---- */
  const [activeTab, setActiveTab] = useState<SignatureTab>("draw");
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  /* ---- Step 3: Placement ---- */
  const [placement, setPlacement] = useState<SignaturePlacementValue | null>(null);

  /* ---- Step 4: Apply ---- */
  const [_jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [jobProgress, setJobProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollStartRef = useRef<number>(0);

  /* ---- Helpers ---- */

  /** Dispatches a custom toast event */
  const dispatchToast = useCallback(
    (type: "success" | "error", message: string) => {
      window.dispatchEvent(
        new CustomEvent("docuconversion:toast", {
          detail: { type, message },
        })
      );
    },
    []
  );

  /** Stops the polling interval */
  const stopPolling = useCallback(() => {
    if (pollTimerRef.current !== null) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  /** Cleanup polling on unmount */
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  /* ---- Step 1 handlers ---- */

  /** Handles PDF file selection and fetches page count */
  const handleFileSelect = useCallback(
    async (file: File) => {
      setPdfFile(file);
      setSignatureDataUrl(null);
      setPlacement(null);
      setJobId(null);
      setJobStatus(null);
      setDownloadUrl(null);
      setJobError(null);
      setPdfInfoError(null);
      setPageCount(0);

      // Fetch page count from the backend
      setPdfInfoLoading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/pdf/preview/info", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to read PDF info");
        }

        const info: PdfInfoResponse = await response.json();
        setPageCount(info.page_count);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Could not read PDF info";
        setPdfInfoError(msg);
        // Default to 1 page so the user can still proceed
        setPageCount(1);
      } finally {
        setPdfInfoLoading(false);
      }
    },
    []
  );

  /** Removes the selected PDF and resets all state */
  const handleFileRemove = useCallback(() => {
    stopPolling();
    setPdfFile(null);
    setPageCount(0);
    setPdfInfoLoading(false);
    setPdfInfoError(null);
    setSignatureDataUrl(null);
    setPlacement(null);
    setJobId(null);
    setJobStatus(null);
    setJobProgress(0);
    setDownloadUrl(null);
    setJobError(null);
    setIsApplying(false);
  }, [stopPolling]);

  /* ---- Step 2 handlers ---- */

  /** Receives a completed signature data URL from any tab */
  const handleSignatureReady = useCallback((dataUrl: string) => {
    setSignatureDataUrl(dataUrl);
  }, []);

  /* ---- Step 3 handler ---- */

  /** Receives placement configuration from the SignaturePlacement component */
  const handlePlacementReady = useCallback((p: SignaturePlacementValue) => {
    setPlacement(p);
  }, []);

  /* ---- Step 4: Apply signature ---- */

  /** Polls the backend for job status. Fires immediately on first call,
   *  then at POLL_INTERVAL_MS intervals until complete/failed/timeout. */
  const startPolling = useCallback(
    (id: string) => {
      stopPolling();
      pollStartRef.current = Date.now();

      const pollOnce = async () => {
        if (Date.now() - pollStartRef.current > MAX_POLL_TIME_MS) {
          stopPolling();
          setJobStatus("failed");
          setJobError("Request timed out. Please try again.");
          setIsApplying(false);
          dispatchToast("error", "Request timed out. Please try again.");
          return;
        }

        try {
          const status = await apiRequest<StatusResponse>(
            `/jobs/status/${id}`
          );

          setJobStatus(status.status);
          setJobProgress(status.progress);

          if (status.status === "completed" || status.status === "failed") {
            stopPolling();
            setIsApplying(false);

            if (status.status === "completed" && status.download_url) {
              setDownloadUrl(status.download_url);
              dispatchToast(
                "success",
                "Signature applied! Your signed PDF is ready to download."
              );
            }

            if (status.status === "failed") {
              setJobError(
                status.error_message || "Signing failed. Please try again."
              );
              dispatchToast(
                "error",
                status.error_message || "Signing failed. Please try again."
              );
            }
          }
        } catch {
          stopPolling();
          const errorMsg = "Lost connection to the server. Please try again.";
          setJobStatus("failed");
          setJobError(errorMsg);
          setIsApplying(false);
          dispatchToast("error", errorMsg);
        }
      };

      // Poll immediately (backend processes signing synchronously,
      // so the job is likely already complete by the time we poll)
      void pollOnce();
      pollTimerRef.current = setInterval(pollOnce, POLL_INTERVAL_MS);
    },
    [stopPolling, dispatchToast]
  );

  /** Converts a data URL to a Blob */
  const dataUrlToBlob = useCallback((dataUrl: string): Blob => {
    const parts = dataUrl.split(",");
    const mime = parts[0].match(/:(.*?);/)?.[1] || "image/png";
    const byteString = atob(parts[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mime });
  }, []);

  /** Submits the PDF and signature to the backend for signing */
  const handleApply = useCallback(async () => {
    if (!pdfFile || !signatureDataUrl || !placement) return;

    setIsApplying(true);
    setJobStatus("uploading");
    setJobProgress(0);
    setJobError(null);
    setDownloadUrl(null);

    try {
      const signatureBlob = dataUrlToBlob(signatureDataUrl);

      const formData = new FormData();
      formData.append("file", pdfFile);
      formData.append("signature", signatureBlob, "signature.png");
      formData.append("page", String(placement.page));
      formData.append("x", String(placement.x));
      formData.append("y", String(placement.y));
      formData.append("width", String(placement.width));
      formData.append("height", String(placement.height));

      const response = await fetch("/api/pdf/sign/apply", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let detail = "Failed to apply signature";
        try {
          const errorBody = await response.json();
          detail = errorBody.detail || detail;
        } catch {
          detail = response.statusText || detail;
        }
        throw new Error(detail);
      }

      const result: SignJobResponse = await response.json();
      setJobId(result.job_id);
      setJobStatus("processing");
      startPolling(result.job_id);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Upload failed. Please try again.";
      setJobStatus("failed");
      setJobError(message);
      setIsApplying(false);
    }
  }, [pdfFile, signatureDataUrl, placement, dataUrlToBlob, startPolling]);

  /** Resets all state to start over */
  const handleReset = useCallback(() => {
    handleFileRemove();
  }, [handleFileRemove]);

  /* ---- Computed state ---- */

  const hasPdf = pdfFile !== null;
  const hasSignature = signatureDataUrl !== null;
  const hasPlacement = placement !== null;
  const canApply = hasPdf && hasSignature && hasPlacement && !isApplying;
  const showProgress = jobStatus === "uploading" || jobStatus === "processing";
  const showDownload = jobStatus === "completed" && downloadUrl !== null;
  const showError = jobStatus === "failed" && jobError !== null;

  /* ---- Status message for progress bar ---- */
  const statusMessage =
    jobStatus === "uploading"
      ? "Uploading files..."
      : jobStatus === "processing"
        ? "Applying signature..."
        : "Processing...";

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <ToolPageLayout
      title="Sign PDF"
      description="Add your electronic signature to any PDF document"
      category="sign"
      icon={PenTool}
      supportingContent={
        <>
          <h2>How to Sign a PDF</h2>
          <p>
            Upload the PDF you need to sign. Create your signature by drawing it on
            the canvas, typing your name to generate one, or uploading an image of
            your handwritten signature. Position it on the correct page, then click
            Apply Signature to produce the signed document.
          </p>
          <h2>Signature Types</h2>
          <p>
            The draw option lets you sign with your mouse, trackpad, or touchscreen
            for a natural handwritten look. The type option renders your name in a
            script font. The upload option accepts a PNG or JPEG image of an existing
            signature, which is useful if you have a scanned copy on file.
          </p>
          <h2>Security and Legal Considerations</h2>
          <p>
            Electronic signatures are legally recognized in most jurisdictions under
            laws such as ESIGN and eIDAS. Your signature image is embedded directly
            into the PDF and is not stored on the server after processing. For
            contracts requiring qualified digital signatures, consult a certified
            signing authority.
          </p>
        </>
      }
    >
      {/* Step 1: Upload PDF */}
      <FileUploader
        acceptedTypes={ACCEPTED_FILE_TYPES.PDF}
        maxFileSize={MAX_FILE_SIZE.ANONYMOUS}
        onFileSelect={handleFileSelect}
        onFileRemove={handleFileRemove}
        disabled={isApplying}
      />

      {/* PDF info loading indicator */}
      {pdfInfoLoading && (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Reading PDF information...
        </div>
      )}

      {/* PDF info error (non-blocking) */}
      {pdfInfoError && (
        <div className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span>{pdfInfoError} (defaulting to 1 page)</span>
        </div>
      )}

      {/* Step 2: Create Signature */}
      {hasPdf && !pdfInfoLoading && !showDownload && (
        <section aria-labelledby="create-signature-heading">
          <h2
            id="create-signature-heading"
            className="mb-4 text-lg font-semibold text-gray-900 dark:text-white"
          >
            Create Your Signature
          </h2>

          {/* Tab bar */}
          <div
            className="mb-5 flex rounded-lg border border-gray-200 dark:border-gray-700"
            role="tablist"
            aria-label="Signature creation methods"
          >
            {SIGNATURE_TABS.map(({ key, label, icon: TabIcon }) => (
              <button
                key={key}
                type="button"
                role="tab"
                id={`tab-${key}`}
                aria-selected={activeTab === key}
                aria-controls={`panel-${key}`}
                onClick={() => setActiveTab(key)}
                disabled={isApplying}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
                  "first:rounded-l-lg last:rounded-r-lg",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500",
                  activeTab === key
                    ? "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                )}
              >
                <TabIcon className="h-4 w-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab panels */}
          <div
            role="tabpanel"
            id={`panel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
            className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900"
          >
            {activeTab === "draw" && (
              <SignatureCanvas onSignatureReady={handleSignatureReady} />
            )}
            {activeTab === "type" && (
              <TypeSignature onSignatureReady={handleSignatureReady} />
            )}
            {activeTab === "upload" && (
              <UploadSignature onSignatureReady={handleSignatureReady} />
            )}
          </div>

          {/* Signature confirmation */}
          {hasSignature && (
            <div className="mt-3 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Signature ready
            </div>
          )}
        </section>
      )}

      {/* Step 3: Place Signature */}
      {hasPdf && hasSignature && pageCount > 0 && !showDownload && (
        <section aria-labelledby="place-signature-heading">
          <h2
            id="place-signature-heading"
            className="mb-4 text-lg font-semibold text-gray-900 dark:text-white"
          >
            Place Your Signature
          </h2>

          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <SignaturePlacement
              pageCount={pageCount}
              pdfFile={pdfFile!}
              signatureDataUrl={signatureDataUrl!}
              onPlacementReady={handlePlacementReady}
            />
          </div>
        </section>
      )}

      {/* Step 4: Apply button */}
      {canApply && !showDownload && !showProgress && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleApply}
            aria-label="Apply signature to PDF"
            className={cn(
              "inline-flex items-center gap-3 rounded-xl px-8 py-4 text-base font-bold text-white shadow-lg transition-all duration-200",
              "bg-gradient-to-r from-orange-600 to-orange-500 shadow-orange-500/25",
              "hover:from-orange-700 hover:to-orange-600 hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2",
              "active:translate-y-0 active:shadow-md"
            )}
          >
            <PenTool className="h-5 w-5" aria-hidden="true" />
            Apply Signature
          </button>
        </div>
      )}

      {/* Progress indicator */}
      {showProgress && (
        <ProgressBar
          progress={jobProgress}
          statusMessage={statusMessage}
          isComplete={false}
          isError={false}
        />
      )}

      {/* Error state */}
      {showError && !showProgress && (
        <ProgressBar
          progress={jobProgress}
          statusMessage="Signing failed"
          isComplete={false}
          isError={true}
          errorMessage={jobError ?? undefined}
          onRetry={handleApply}
        />
      )}

      {/* Download result */}
      {showDownload && (
        <DownloadButton
          downloadUrl={downloadUrl!}
          fileName={pdfFile ? `signed_${pdfFile.name}` : "signed.pdf"}
          onReset={handleReset}
        />
      )}
    </ToolPageLayout>
  );
}
