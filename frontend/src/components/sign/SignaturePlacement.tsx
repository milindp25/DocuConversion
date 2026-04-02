/**
 * DocuSign-style signature placement component.
 * Renders the actual PDF page as a background and lets the user
 * drag their signature to any position on it.
 */

"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/** Describes the placement of a signature on a PDF page */
export interface SignaturePlacementValue {
  /** 1-indexed page number */
  page: number;
  /** Horizontal position as 0-1 normalized value */
  x: number;
  /** Vertical position as 0-1 normalized value */
  y: number;
  /** Signature width as a fraction of page width (0-1) */
  width: number;
  /** Signature height as a fraction of page height (0-1) */
  height: number;
}

/** Props for the SignaturePlacement component */
export interface SignaturePlacementProps {
  /** Total number of pages in the uploaded PDF */
  pageCount: number;
  /** The PDF file — used to fetch the page preview image */
  pdfFile: File;
  /** Data URL of the signature image to preview on the PDF */
  signatureDataUrl: string;
  /** Callback invoked whenever the placement configuration changes */
  onPlacementReady: (placement: SignaturePlacementValue) => void;
}

/** Width options as a fraction of page width */
const SIZE_OPTIONS: { label: string; value: number }[] = [
  { label: "S", value: 0.12 },
  { label: "M", value: 0.22 },
  { label: "L", value: 0.32 },
];

/** Default placement: bottom-right area */
const DEFAULT_X = 0.6;
const DEFAULT_Y = 0.78;

/**
 * SignaturePlacement shows the real PDF page and lets the user drag
 * their signature to the desired position — like DocuSign.
 */
export function SignaturePlacement({
  pageCount,
  pdfFile,
  signatureDataUrl,
  onPlacementReady,
}: SignaturePlacementProps) {
  const [page, setPage] = useState(1);
  const [sizeIndex, setSizeIndex] = useState(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  /** Normalized (0-1) top-left corner of the signature */
  const [sigPos, setSigPos] = useState({ x: DEFAULT_X, y: DEFAULT_Y });

  /** Natural aspect ratio of the signature image (height / width).
   *  Defaults to 0.45 (~2:1) until the image loads and we measure it. */
  const [sigAspectRatio, setSigAspectRatio] = useState(0.45);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  /** Offset from the sig's top-left corner to where the user grabbed it */
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  /** Measure the signature image's natural aspect ratio so we send
   *  accurate height coordinates to the backend instead of hardcoding. */
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth > 0) {
        setSigAspectRatio(img.naturalHeight / img.naturalWidth);
      }
    };
    img.src = signatureDataUrl;
  }, [signatureDataUrl]);

  /** Fetch the PDF page preview whenever page changes */
  useEffect(() => {
    let cancelled = false;

    const fetchPreview = async () => {
      setIsLoadingPreview(true);
      setPreviewUrl(null);

      try {
        const formData = new FormData();
        formData.append("file", pdfFile);
        formData.append("page", String(page));

        const response = await fetch("/api/pdf/preview/render-page", {
          method: "POST",
          body: formData,
        });

        if (!response.ok || cancelled) return;

        // Use a data URL instead of a blob URL so React StrictMode's
        // effect cleanup (which would call URL.revokeObjectURL) cannot
        // invalidate the preview — data URLs are plain strings, not
        // revocable handles.
        const blob = await response.blob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        if (!cancelled) setPreviewUrl(dataUrl);
      } catch {
        // Preview unavailable — user can still place the signature
      } finally {
        if (!cancelled) setIsLoadingPreview(false);
      }
    };

    void fetchPreview();

    return () => { cancelled = true; };
  }, [pdfFile, page]);

  /** Emit placement whenever position, size, or page changes */
  useEffect(() => {
    const w = SIZE_OPTIONS[sizeIndex].value;
    onPlacementReady({
      page,
      x: sigPos.x,
      y: sigPos.y,
      width: w,
      height: w * sigAspectRatio, // use measured signature aspect ratio
    });
  }, [page, sizeIndex, sigPos, sigAspectRatio, onPlacementReady]);

  /** Begin drag — record where on the signature the user grabbed */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      isDraggingRef.current = true;

      // Offset from the signature's top-left corner to the mouse position
      dragOffsetRef.current = {
        x: e.clientX - rect.left - sigPos.x * rect.width,
        y: e.clientY - rect.top - sigPos.y * rect.height,
      };
    },
    [sigPos]
  );

  /** Move — attached to window so fast mouse movement doesn't break drag */
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const sigW = SIZE_OPTIONS[sizeIndex].value;

      const rawX = (e.clientX - rect.left - dragOffsetRef.current.x) / rect.width;
      const rawY = (e.clientY - rect.top - dragOffsetRef.current.y) / rect.height;

      setSigPos({
        x: Math.max(0, Math.min(1 - sigW, rawX)),
        y: Math.max(0, Math.min(1 - sigW * sigAspectRatio, rawY)),
      });
    };

    const handleUp = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [sizeIndex]);

  /** Touch equivalents for mobile */
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!containerRef.current) return;
      const touch = e.touches[0];
      const rect = containerRef.current.getBoundingClientRect();
      isDraggingRef.current = true;
      dragOffsetRef.current = {
        x: touch.clientX - rect.left - sigPos.x * rect.width,
        y: touch.clientY - rect.top - sigPos.y * rect.height,
      };
    },
    [sigPos]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!isDraggingRef.current || !containerRef.current) return;
      const touch = e.touches[0];
      const rect = containerRef.current.getBoundingClientRect();
      const sigW = SIZE_OPTIONS[sizeIndex].value;
      const rawX = (touch.clientX - rect.left - dragOffsetRef.current.x) / rect.width;
      const rawY = (touch.clientY - rect.top - dragOffsetRef.current.y) / rect.height;
      setSigPos({
        x: Math.max(0, Math.min(1 - sigW, rawX)),
        y: Math.max(0, Math.min(1 - sigW * sigAspectRatio, rawY)),
      });
    },
    [sizeIndex]
  );

  const sigWidth = SIZE_OPTIONS[sizeIndex].value;

  return (
    <div className="flex flex-col gap-4">
      {/* Controls row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Page selector */}
        {pageCount > 1 && (
          <div className="flex items-center gap-2">
            <label
              htmlFor="sig-page-select"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Page
            </label>
            <select
              id="sig-page-select"
              value={page}
              onChange={(e) => setPage(Number(e.target.value))}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm",
                "border-gray-300 bg-white text-gray-900",
                "dark:border-gray-600 dark:bg-gray-800 dark:text-white",
                "focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              )}
            >
              {Array.from({ length: pageCount }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Page {i + 1}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Size buttons */}
        <fieldset>
          <legend className="sr-only">Signature size</legend>
          <div className="flex gap-1.5">
            {SIZE_OPTIONS.map((opt, i) => (
              <label
                key={opt.label}
                className={cn(
                  "flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border text-sm font-semibold transition-colors",
                  "focus-within:ring-2 focus-within:ring-orange-500",
                  sizeIndex === i
                    ? "border-orange-500 bg-orange-50 text-orange-700 dark:border-orange-500 dark:bg-orange-950 dark:text-orange-300"
                    : "border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:text-gray-400"
                )}
              >
                <input
                  type="radio"
                  name="sig-size"
                  value={opt.label}
                  checked={sizeIndex === i}
                  onChange={() => setSizeIndex(i)}
                  className="sr-only"
                  aria-label={`${opt.label === "S" ? "Small" : opt.label === "M" ? "Medium" : "Large"} signature`}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {/* PDF canvas — the user drags the signature here.
          The container is sized by the image naturally (w-full h-auto) so
          coordinates are always relative to the actual page content — no
          letterboxing offset regardless of PDF aspect ratio. */}
      <div
        ref={containerRef}
        className="relative select-none overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-900"
        style={{ cursor: "default" }}
        aria-label="Drag your signature to position it on the PDF page"
      >
        {/* Loading placeholder — A4-ish min height so the area doesn't collapse */}
        {isLoadingPreview && (
          <div className="flex items-center justify-center" style={{ minHeight: "420px" }}>
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        )}

        {/* No-preview fallback */}
        {!previewUrl && !isLoadingPreview && (
          <div
            className="flex items-center justify-center text-sm text-gray-400 dark:text-gray-500"
            style={{ minHeight: "420px" }}
          >
            PDF preview unavailable — drag the signature below to position it
          </div>
        )}

        {/* PDF page preview — natural size drives the container height so
            absolute-positioned elements map 1:1 to page coordinates. */}
        {previewUrl && !isLoadingPreview && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={previewUrl}
            alt={`Page ${page} preview`}
            className="w-full h-auto block"
            draggable={false}
          />
        )}

        {/* Draggable signature overlay — only render when we have a preview so
            the container has a known size and drag math is accurate. */}
        {previewUrl && !isLoadingPreview && (
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => { isDraggingRef.current = false; }}
            aria-label="Drag to position your signature"
            role="button"
            tabIndex={0}
            style={{
              position: "absolute",
              left: `${sigPos.x * 100}%`,
              top: `${sigPos.y * 100}%`,
              width: `${sigWidth * 100}%`,
              cursor: "grab",
            }}
            className={cn(
              "rounded border-2 border-dashed border-orange-400 bg-white/20 p-1 shadow-lg",
              "active:cursor-grabbing dark:bg-black/20"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={signatureDataUrl}
              alt="Your signature"
              className="w-full h-auto pointer-events-none"
              draggable={false}
            />
          </div>
        )}
      </div>

      <p className="text-center text-xs text-gray-400 dark:text-gray-500">
        Drag the signature to position it · use S / M / L to resize
      </p>
    </div>
  );
}
