/**
 * Freehand signature drawing canvas using HTML5 Canvas API.
 * Supports both mouse and touch input for drawing signatures.
 * Exports the drawn signature as a PNG data URL.
 */

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

import { Eraser, Check } from "lucide-react";

import { cn } from "@/lib/utils";

/** Props for the SignatureCanvas component */
export interface SignatureCanvasProps {
  /** Callback invoked with the signature PNG data URL when the user confirms */
  onSignatureReady: (dataUrl: string) => void;
  /** Canvas width in pixels */
  width?: number;
  /** Canvas height in pixels */
  height?: number;
}

/**
 * SignatureCanvas renders an HTML5 canvas element where users can draw
 * a freehand signature using mouse or touch input. Provides "Clear"
 * and "Done" actions to reset or confirm the drawing.
 *
 * @example
 * ```tsx
 * <SignatureCanvas
 *   onSignatureReady={(dataUrl) => setSignature(dataUrl)}
 *   width={300}
 *   height={150}
 * />
 * ```
 */
export function SignatureCanvas({
  onSignatureReady,
  width = 300,
  height = 150,
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const [hasStrokes, setHasStrokes] = useState(false);

  /** Initializes the canvas context with drawing defaults */
  const getContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    return ctx;
  }, []);

  /** Fills the canvas with a white background on mount */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);
  }, [width, height]);

  /** Converts page coordinates to canvas-local coordinates */
  const getCanvasPoint = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    },
    []
  );

  /** Begins a new stroke path at the given coordinates */
  const startDrawing = useCallback(
    (x: number, y: number) => {
      const ctx = getContext();
      if (!ctx) return;
      isDrawingRef.current = true;
      ctx.beginPath();
      ctx.moveTo(x, y);
    },
    [getContext]
  );

  /** Continues the current stroke to the given coordinates */
  const draw = useCallback(
    (x: number, y: number) => {
      if (!isDrawingRef.current) return;
      const ctx = getContext();
      if (!ctx) return;
      ctx.lineTo(x, y);
      ctx.stroke();
      setHasStrokes(true);
    },
    [getContext]
  );

  /** Ends the current stroke */
  const stopDrawing = useCallback(() => {
    isDrawingRef.current = false;
  }, []);

  /* ---- Mouse event handlers ---- */

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const { x, y } = getCanvasPoint(e.clientX, e.clientY);
      startDrawing(x, y);
    },
    [getCanvasPoint, startDrawing]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const { x, y } = getCanvasPoint(e.clientX, e.clientY);
      draw(x, y);
    },
    [getCanvasPoint, draw]
  );

  const handleMouseUp = useCallback(() => {
    stopDrawing();
  }, [stopDrawing]);

  const handleMouseLeave = useCallback(() => {
    stopDrawing();
  }, [stopDrawing]);

  /* ---- Touch event handlers ---- */

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const touch = e.touches[0];
      const { x, y } = getCanvasPoint(touch.clientX, touch.clientY);
      startDrawing(x, y);
    },
    [getCanvasPoint, startDrawing]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const touch = e.touches[0];
      const { x, y } = getCanvasPoint(touch.clientX, touch.clientY);
      draw(x, y);
    },
    [getCanvasPoint, draw]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      stopDrawing();
    },
    [stopDrawing]
  );

  /** Clears the canvas and resets to white background */
  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);
    setHasStrokes(false);
  }, [width, height]);

  /** Exports the canvas content as a PNG data URL */
  const handleDone = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    onSignatureReady(dataUrl);
  }, [onSignatureReady]);

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        aria-label="Signature drawing canvas. Use mouse or touch to draw your signature."
        role="img"
        className={cn(
          "w-full max-w-[300px] cursor-crosshair rounded-lg border-2 border-dashed",
          "border-gray-300 bg-white dark:border-gray-600",
          "touch-none select-none"
        )}
        style={{ aspectRatio: `${width} / ${height}` }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      <p className="text-xs text-gray-400 dark:text-gray-500">
        Draw your signature above
      </p>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear signature canvas"
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            "border border-gray-300 text-gray-700 hover:bg-gray-100",
            "dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          )}
        >
          <Eraser className="h-4 w-4" aria-hidden="true" />
          Clear
        </button>

        <button
          type="button"
          onClick={handleDone}
          disabled={!hasStrokes}
          aria-label="Confirm drawn signature"
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors",
            "bg-orange-600 hover:bg-orange-700",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          )}
        >
          <Check className="h-4 w-4" aria-hidden="true" />
          Done
        </button>
      </div>
    </div>
  );
}
