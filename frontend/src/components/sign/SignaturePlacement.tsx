/**
 * Signature placement controls for positioning the signature on a PDF page.
 * Provides a visual position grid, page selector, and size controls.
 */

"use client";

import React, { useCallback, useEffect, useState } from "react";

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
  /** Callback invoked whenever the placement configuration changes */
  onPlacementReady: (placement: SignaturePlacementValue) => void;
}

/** Named position presets mapped to normalized x/y coordinates */
const POSITION_PRESETS: { label: string; x: number; y: number }[] = [
  { label: "Top Left", x: 0.05, y: 0.05 },
  { label: "Top Center", x: 0.35, y: 0.05 },
  { label: "Top Right", x: 0.65, y: 0.05 },
  { label: "Bottom Left", x: 0.05, y: 0.8 },
  { label: "Bottom Center", x: 0.35, y: 0.8 },
  { label: "Bottom Right", x: 0.65, y: 0.8 },
];

/** Size presets mapped to normalized width values */
const SIZE_OPTIONS: { label: string; value: number }[] = [
  { label: "Small", value: 0.1 },
  { label: "Medium", value: 0.2 },
  { label: "Large", value: 0.3 },
];

/**
 * SignaturePlacement provides controls for choosing where on a PDF page
 * the signature will be placed. Includes a 6-position visual grid,
 * optional manual X/Y sliders, page selector, and size control.
 *
 * @example
 * ```tsx
 * <SignaturePlacement
 *   pageCount={5}
 *   onPlacementReady={(p) => setPlacement(p)}
 * />
 * ```
 */
export function SignaturePlacement({
  pageCount,
  onPlacementReady,
}: SignaturePlacementProps) {
  const [page, setPage] = useState(1);
  const [selectedPreset, setSelectedPreset] = useState(4); // bottom-left default
  const [sizeIndex, setSizeIndex] = useState(1); // medium default
  const [manualX, setManualX] = useState(POSITION_PRESETS[4].x * 100);
  const [manualY, setManualY] = useState(POSITION_PRESETS[4].y * 100);
  const [useManual, setUseManual] = useState(false);

  /** Computes the aspect-ratio-based height from the width */
  const computeHeight = useCallback((w: number) => w * 0.5, []);

  /** Emits the current placement to the parent */
  useEffect(() => {
    const sizeW = SIZE_OPTIONS[sizeIndex].value;
    const sizeH = computeHeight(sizeW);
    const x = useManual ? manualX / 100 : POSITION_PRESETS[selectedPreset].x;
    const y = useManual ? manualY / 100 : POSITION_PRESETS[selectedPreset].y;

    onPlacementReady({
      page,
      x,
      y,
      width: sizeW,
      height: sizeH,
    });
  }, [page, selectedPreset, sizeIndex, manualX, manualY, useManual, computeHeight, onPlacementReady]);

  /** Handles clicking a position preset in the grid */
  const handlePresetClick = useCallback((index: number) => {
    setSelectedPreset(index);
    setUseManual(false);
    setManualX(POSITION_PRESETS[index].x * 100);
    setManualY(POSITION_PRESETS[index].y * 100);
  }, []);

  return (
    <div className="flex flex-col gap-5">
      {/* Page selector */}
      <div>
        <label
          htmlFor="page-select"
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Page
        </label>
        <select
          id="page-select"
          value={page}
          onChange={(e) => setPage(Number(e.target.value))}
          aria-label="Select page for signature placement"
          className={cn(
            "w-full rounded-lg border px-3 py-2 text-sm transition-colors",
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

      {/* Position grid */}
      <div>
        <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
          Position
        </p>
        <div
          className="grid grid-cols-3 gap-2"
          role="radiogroup"
          aria-label="Signature position on page"
        >
          {POSITION_PRESETS.map((preset, index) => (
            <button
              key={preset.label}
              type="button"
              role="radio"
              aria-checked={selectedPreset === index && !useManual}
              aria-label={preset.label}
              onClick={() => handlePresetClick(index)}
              className={cn(
                "relative flex h-16 items-center justify-center rounded-lg border text-xs font-medium transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500",
                selectedPreset === index && !useManual
                  ? "border-orange-500 bg-orange-50 text-orange-700 shadow-sm dark:border-orange-500 dark:bg-orange-950 dark:text-orange-300"
                  : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-800"
              )}
            >
              {/* Visual indicator dot */}
              <span
                className={cn(
                  "h-3 w-3 rounded-full transition-colors",
                  selectedPreset === index && !useManual
                    ? "bg-orange-500"
                    : "bg-gray-300 dark:bg-gray-600"
                )}
                aria-hidden="true"
              />
              <span className="ml-1.5">{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Manual position toggle */}
      <div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={useManual}
            onChange={(e) => setUseManual(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            aria-label="Enable manual position controls"
          />
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Manual position
          </span>
        </label>

        {useManual && (
          <div className="mt-3 space-y-3">
            <div>
              <label
                htmlFor="manual-x"
                className="mb-1 block text-xs text-gray-500 dark:text-gray-400"
              >
                Horizontal: {Math.round(manualX)}%
              </label>
              <input
                id="manual-x"
                type="range"
                min={0}
                max={100}
                value={manualX}
                onChange={(e) => setManualX(Number(e.target.value))}
                aria-label="Horizontal position percentage"
                className="w-full accent-orange-500"
              />
            </div>
            <div>
              <label
                htmlFor="manual-y"
                className="mb-1 block text-xs text-gray-500 dark:text-gray-400"
              >
                Vertical: {Math.round(manualY)}%
              </label>
              <input
                id="manual-y"
                type="range"
                min={0}
                max={100}
                value={manualY}
                onChange={(e) => setManualY(Number(e.target.value))}
                aria-label="Vertical position percentage"
                className="w-full accent-orange-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Size selector */}
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
          Signature size
        </legend>
        <div className="flex gap-2">
          {SIZE_OPTIONS.map((option, index) => (
            <label
              key={option.label}
              className={cn(
                "flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors",
                "focus-within:ring-2 focus-within:ring-orange-500",
                sizeIndex === index
                  ? "border-orange-500 bg-orange-50 text-orange-700 dark:border-orange-500 dark:bg-orange-950 dark:text-orange-300"
                  : "border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500"
              )}
            >
              <input
                type="radio"
                name="signature-size"
                value={option.label}
                checked={sizeIndex === index}
                onChange={() => setSizeIndex(index)}
                className="sr-only"
                aria-label={`${option.label} signature size`}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
