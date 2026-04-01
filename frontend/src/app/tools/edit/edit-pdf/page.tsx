/**
 * PDF editor tool page.
 * The most complex tool in DocuConversion — lets users open a PDF,
 * add text, highlights, and shapes as annotations, then download
 * the edited PDF with all changes applied by the backend.
 */

"use client";

import { useCallback, useState } from "react";

import { PenLine, Loader2, FileText, AlertCircle } from "lucide-react";

import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { EditorToolbar, EditorCanvas, AnnotationPanel } from "@/components/editor";
import { useEditorState } from "@/hooks/useEditorState";
import { uploadFile } from "@/lib/api-client";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from "@/lib/constants";

/** Response from the backend when applying edits */
interface EditResponse {
  job_id: string;
  download_url: string;
}

/** Response from the preview/info endpoint */
interface PreviewInfoResponse {
  page_count: number;
  width: number;
  height: number;
}

/**
 * EditPdfPage assembles the full PDF editor experience:
 * 1. FileUploader when no file is loaded
 * 2. EditorToolbar + EditorCanvas + AnnotationPanel once a file is loaded
 * 3. "Apply changes & download" button that sends annotations to the backend
 */
export default function EditPdfPage() {
  const {
    state,
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
    selectAnnotation,
    setActiveTool,
    undo,
    redo,
    canUndo,
    canRedo,
    setZoom,
    setPage,
    loadFile,
    unloadFile,
  } = useEditorState();

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [pdfDimensions, setPdfDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  /**
   * Fetches a rendered page image from the backend preview endpoint.
   * @param file - The PDF file to render
   * @param page - 1-indexed page number
   */
  const fetchPagePreview = useCallback(async (file: File, page: number) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("page", String(page));

      const response = await fetch("/api/pdf/preview/render-page", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) return null;

      // Data URL is immune to StrictMode blob-revocation bugs
      const blob = await response.blob();
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }, []);

  /**
   * Handles PDF file selection from the uploader.
   * Calls the preview/info endpoint to get page count, then attempts
   * to render a preview image of the first page.
   */
  const handleFileSelect = useCallback(
    async (file: File) => {
      setIsLoadingPreview(true);
      setPreviewError(null);
      setPdfDimensions(null);
      setPreviewImageUrl(null);

      // Default load with 1 page — will update once we know actual count
      loadFile(file, 1);

      try {
        // Fetch PDF info (page count, dimensions)
        const infoFormData = new FormData();
        infoFormData.append("file", file);

        const infoRes = await fetch("/api/pdf/preview/info", {
          method: "POST",
          body: infoFormData,
        });

        if (infoRes.ok) {
          const info: PreviewInfoResponse = await infoRes.json();
          setPdfDimensions({ width: info.width, height: info.height });
          // Re-load file with the correct page count
          loadFile(file, info.page_count);
        }

        // Try to fetch page 1 preview image
        const imageUrl = await fetchPagePreview(file, 1);
        if (imageUrl) {
          setPreviewImageUrl(imageUrl);
        }
      } catch {
        setPreviewError("Could not load PDF preview.");
      } finally {
        setIsLoadingPreview(false);
      }
    },
    [loadFile, fetchPagePreview]
  );

  /** Handles file removal — resets the editor and preview state */
  const handleFileRemove = useCallback(() => {
    setPreviewImageUrl(null);
    setPdfDimensions(null);
    setPreviewError(null);
    unloadFile();
    setSaveError(null);
  }, [unloadFile, previewImageUrl]);

  /** Sends annotations to the backend for PDF modification and triggers download */
  const handleSave = useCallback(async () => {
    if (!state.file || state.annotations.length === 0) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const annotationsJson = JSON.stringify(
        state.annotations.map((a) => ({
          type: a.type,
          page: a.pageNumber,
          x: a.x,
          y: a.y,
          width: a.width,
          height: a.height,
          properties: a.properties,
        }))
      );

      const response = await uploadFile<EditResponse>(
        "/edit/edit-pdf",
        state.file,
        { annotations: annotationsJson }
      );

      // Trigger download if we got a URL back
      if (response.download_url) {
        const link = document.createElement("a");
        link.href = response.download_url;
        link.download = state.file.name.replace(
          /\.pdf$/i,
          "-edited.pdf"
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to apply edits. Please try again.";
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  }, [state.file, state.annotations]);

  const hasFile = state.file !== null;

  return (
    <ToolPageLayout
      title="Edit PDF"
      description="Add text, highlights, and shapes to your PDF documents"
      category="edit"
      icon={PenLine}
    >
      {/* Step 1: File upload */}
      {!hasFile && (
        <FileUploader
          acceptedTypes={ACCEPTED_FILE_TYPES.PDF}
          maxFileSize={MAX_FILE_SIZE.ANONYMOUS}
          onFileSelect={handleFileSelect}
          onFileRemove={handleFileRemove}
        />
      )}

      {/* Step 2: Editor interface */}
      {hasFile && (
        <div className="space-y-4">
          {/* Toolbar */}
          <EditorToolbar
            activeTool={state.activeTool}
            onToolChange={setActiveTool}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undo}
            onRedo={redo}
            zoom={state.zoom}
            onZoomChange={setZoom}
            currentPage={state.currentPage}
            totalPages={state.totalPages}
            onPageChange={setPage}
            onSave={handleSave}
            isSaving={isSaving}
          />

          {/* Main content area: Canvas + Side panel */}
          <div className="flex flex-col gap-4 lg:flex-row">
            {/* Left: PDF canvas area */}
            <div className="flex-1">
              <EditorCanvas
                file={state.file}
                fileUrl={state.fileUrl}
                annotations={state.annotations}
                selectedAnnotation={state.selectedAnnotation}
                onAnnotationSelect={selectAnnotation}
                currentPage={state.currentPage}
                totalPages={state.totalPages}
                zoom={state.zoom}
                previewImageUrl={previewImageUrl}
                isLoadingPreview={isLoadingPreview}
                previewError={previewError}
                onPageChange={async (page: number) => {
                  setPage(page);
                  if (state.file) {
                    const newUrl = await fetchPagePreview(state.file, page);
                    setPreviewImageUrl(newUrl);
                  }
                }}
              />
            </div>

            {/* Right: Annotation panel */}
            <AnnotationPanel
              annotations={state.annotations}
              selectedAnnotation={state.selectedAnnotation}
              currentPage={state.currentPage}
              totalPages={state.totalPages}
              onAddAnnotation={addAnnotation}
              onUpdateAnnotation={updateAnnotation}
              onRemoveAnnotation={removeAnnotation}
              onSelectAnnotation={selectAnnotation}
            />
          </div>

          {/* Save error message */}
          {saveError && (
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
            >
              {saveError}
            </div>
          )}

          {/* Bottom action bar */}
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <button
              type="button"
              onClick={handleFileRemove}
              className="text-sm text-gray-500 underline transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Upload a different file
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || state.annotations.length === 0}
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:pointer-events-none disabled:opacity-50"
            >
              {isSaving && (
                <Loader2
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              )}
              {isSaving ? "Applying changes..." : "Apply changes & download"}
            </button>
          </div>
        </div>
      )}
    </ToolPageLayout>
  );
}
