/**
 * Full-page drag and drop overlay.
 * Shows when a user drags a file anywhere over the page.
 * Redirects to the appropriate tool based on file type.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Upload, FileText, FileImage, FileSpreadsheet } from "lucide-react";

import { cn } from "@/lib/utils";

/** Map file extensions to their target tool routes */
const FILE_ROUTE_MAP: Record<string, string> = {
  ".pdf": "/tools/convert",
  ".doc": "/tools/convert/word-to-pdf",
  ".docx": "/tools/convert/word-to-pdf",
  ".png": "/tools/convert/image-to-pdf",
  ".jpg": "/tools/convert/image-to-pdf",
  ".jpeg": "/tools/convert/image-to-pdf",
  ".gif": "/tools/convert/image-to-pdf",
  ".bmp": "/tools/convert/image-to-pdf",
  ".tiff": "/tools/convert/image-to-pdf",
  ".webp": "/tools/convert/image-to-pdf",
};

/**
 * Resolves a filename to its icon component based on extension.
 */
function getFileIcon(fileName: string) {
  const ext = fileName.toLowerCase().slice(fileName.lastIndexOf("."));
  if ([".png", ".jpg", ".jpeg", ".gif", ".bmp", ".tiff", ".webp"].includes(ext)) {
    return FileImage;
  }
  if ([".xls", ".xlsx"].includes(ext)) {
    return FileSpreadsheet;
  }
  return FileText;
}

/**
 * GlobalDropZone renders an invisible listener over the full viewport.
 * When a file is dragged over the page, a semi-transparent overlay appears
 * inviting the user to drop the file. On drop, it navigates to the
 * appropriate tool based on the file extension.
 *
 * Place this component inside the root layout so it covers every page.
 */
export function GlobalDropZone() {
  const [isDragActive, setIsDragActive] = useState(false);
  const dragCounterRef = useRef(0);
  const router = useRouter();

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (dragCounterRef.current === 1) {
      setIsDragActive(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDragActive(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragActive(false);

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const fileName = files[0].name.toLowerCase();
      const ext = fileName.slice(fileName.lastIndexOf("."));
      const route = FILE_ROUTE_MAP[ext];

      if (route) {
        router.push(route);
      } else {
        // Fallback: send to the generic convert page
        router.push("/tools/convert");
      }
    },
    [router]
  );

  useEffect(() => {
    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  if (!isDragActive) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center",
        "bg-gray-950/70 backdrop-blur-sm",
        "transition-opacity duration-200"
      )}
      aria-live="polite"
      aria-label="Drop your file to get started"
    >
      <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-blue-400 bg-gray-900/80 px-16 py-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-950">
          <Upload
            className="h-8 w-8 text-blue-400"
            aria-hidden="true"
          />
        </div>

        <p className="text-xl font-semibold text-white">
          Drop your file to get started
        </p>

        <p className="text-sm text-gray-400">
          PDF, Word, Excel, PowerPoint, or image files
        </p>
      </div>
    </div>
  );
}
