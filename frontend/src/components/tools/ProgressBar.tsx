/**
 * Processing progress indicator for DocuConversion tool pages.
 * Displays an animated progress bar with status messages,
 * completion checkmark, or error state.
 */

"use client";

import { CheckCircle2, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";

/** Props for the ProgressBar component */
export interface ProgressBarProps {
  /** Current progress (0-100) */
  progress: number;
  /** Current status label (e.g., "Converting...", "Almost done...") */
  statusMessage: string;
  /** Whether processing has completed */
  isComplete: boolean;
  /** Whether processing has failed */
  isError: boolean;
  /** Error message to display on failure */
  errorMessage?: string;
  /** Optional callback to retry after a failure */
  onRetry?: () => void;
}

/**
 * ProgressBar renders an animated horizontal bar showing file processing
 * progress. Displays a green checkmark on completion or a red error
 * message on failure.
 *
 * @example
 * ```tsx
 * <ProgressBar
 *   progress={65}
 *   statusMessage="Converting..."
 *   isComplete={false}
 *   isError={false}
 * />
 * ```
 */
export function ProgressBar({
  progress,
  statusMessage,
  isComplete,
  isError,
  errorMessage,
  onRetry,
}: ProgressBarProps) {
  /** Clamp progress to 0-100 range */
  const clampedProgress = Math.min(100, Math.max(0, progress));

  /** Determine the step label based on progress */
  const stepLabel = isError
    ? "An error occurred"
    : isComplete
      ? "All steps complete"
      : clampedProgress < 30
        ? "Uploading file..."
        : clampedProgress < 60
          ? "Analyzing document..."
          : clampedProgress < 90
            ? "Processing content..."
            : "Finalizing output...";

  return (
    <div className="w-full" role="region" aria-label="Processing progress">
      {/* Progress bar header */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {statusMessage}
        </span>
        <span className="text-sm font-semibold tabular-nums text-gray-500 dark:text-gray-400">
          {Math.round(clampedProgress)}%
        </span>
      </div>

      {/* Progress bar track */}
      <div
        className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
        role="progressbar"
        aria-valuenow={clampedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${Math.round(clampedProgress)}% complete`}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            isError
              ? "bg-gradient-to-r from-red-600 to-red-400"
              : isComplete
                ? "bg-gradient-to-r from-green-600 to-emerald-400"
                : "bg-gradient-to-r from-blue-600 to-blue-400 animate-progress-shimmer"
          )}
          style={{
            width: `${clampedProgress}%`,
            ...((!isComplete && !isError)
              ? {
                  backgroundImage:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.25) 50%, transparent)",
                  backgroundSize: "200% 100%",
                }
              : {}),
          }}
        />
      </div>

      {/* Step indicator */}
      <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
        {stepLabel}
      </p>

      {/* Completion state */}
      {isComplete && !isError && (
        <div className="mt-3 flex items-center gap-2 text-green-600 dark:text-green-400">
          <CheckCircle2
            className="h-5 w-5 animate-scale-pop"
            aria-hidden="true"
          />
          <span className="text-sm font-medium">Processing complete</span>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <XCircle className="h-5 w-5" aria-hidden="true" />
            <span className="text-sm font-medium">
              {errorMessage || "Processing failed. Please try again."}
            </span>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="text-sm font-medium text-blue-500 hover:text-blue-400 transition-colors"
              aria-label="Try again"
            >
              &#8635; Try again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
