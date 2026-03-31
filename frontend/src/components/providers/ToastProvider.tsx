/**
 * Toast notification provider for DocuConversion.
 * Provides a global context for managing toast notifications.
 * Use the useToast() hook to add toasts from any client component.
 */

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import { Toast, type ToastItem, type ToastVariant } from "@/components/ui/Toast";

/** Shape of the toast context value */
export interface ToastContextValue {
  /** Add a toast notification */
  addToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/** Props for the ToastProvider component */
export interface ToastProviderProps {
  children: React.ReactNode;
}

/** Maximum number of visible toasts at once */
const MAX_TOASTS = 5;

let toastCounter = 0;

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = `toast-${++toastCounter}`;
      setToasts((prev) => [...prev.slice(-(MAX_TOASTS - 1)), { id, message, variant }]);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /**
   * Listens for custom "docuconversion:toast" events dispatched by hooks
   * (e.g., useFileProcessor) that cannot access React context directly.
   */
  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const { type, message } = (e as CustomEvent<{ type: string; message: string }>).detail;
      const variant: ToastVariant =
        type === "success" ? "success" : type === "error" ? "error" : "info";
      addToast(message, variant);
    };

    window.addEventListener("docuconversion:toast", handleToastEvent);
    return () => window.removeEventListener("docuconversion:toast", handleToastEvent);
  }, [addToast]);

  const contextValue = useMemo(() => ({ addToast }), [addToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      {/* Toast container — fixed at bottom-right */}
      {toasts.length > 0 && (
        <div
          className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2"
          aria-label="Notifications"
        >
          {toasts.map((toast) => (
            <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

/**
 * Hook to access the toast notification system.
 * Must be used within a ToastProvider.
 *
 * @returns Object with addToast function
 *
 * @example
 * const { addToast } = useToast();
 * addToast("File uploaded successfully", "success");
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
