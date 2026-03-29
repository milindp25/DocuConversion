/**
 * Toast notification component for DocuConversion.
 * Renders individual toast notifications with success, error, and info variants.
 * Automatically dismisses after 3 seconds.
 */

"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

/** Supported toast variants */
export type ToastVariant = "success" | "error" | "info";

/** Shape of a single toast notification */
export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

/** Props for the Toast component */
export interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

/** Variant-specific configuration */
const VARIANT_CONFIG: Record<
  ToastVariant,
  { icon: typeof CheckCircle; bgClass: string; iconClass: string }
> = {
  success: {
    icon: CheckCircle,
    bgClass: "border-green-500/20 bg-green-500/10",
    iconClass: "text-green-400",
  },
  error: {
    icon: AlertCircle,
    bgClass: "border-red-500/20 bg-red-500/10",
    iconClass: "text-red-400",
  },
  info: {
    icon: Info,
    bgClass: "border-blue-500/20 bg-blue-500/10",
    iconClass: "text-blue-400",
  },
};

/** Auto-dismiss duration in milliseconds */
const AUTO_DISMISS_MS = 3000;

export function Toast({ toast, onDismiss }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const config = VARIANT_CONFIG[toast.variant];
  const Icon = config.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss(toast.id), 200);
    }, AUTO_DISMISS_MS);

    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 200);
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg transition-all duration-200",
        config.bgClass,
        isExiting
          ? "translate-x-full opacity-0"
          : "translate-x-0 opacity-100"
      )}
    >
      <Icon className={cn("h-5 w-5 flex-shrink-0", config.iconClass)} aria-hidden="true" />
      <p className="flex-1 text-sm text-gray-200">{toast.message}</p>
      <button
        type="button"
        onClick={handleDismiss}
        className="flex-shrink-0 rounded p-1 text-gray-500 transition-colors hover:text-gray-300"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
