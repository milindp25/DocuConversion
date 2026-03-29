/**
 * Convert tools category page.
 * Lists all available PDF conversion tools with descriptions and links.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Convert PDF — PDF to Word, Excel, Image & More",
  description:
    "Convert PDFs to Word, Excel, PowerPoint, Images, and more. Or convert documents and images to PDF. Free, fast, and no account needed.",
};

/** Available conversion tools */
const CONVERSION_TOOLS = [
  { id: "pdf-to-word", name: "PDF to Word", description: "Convert PDF documents to editable Word (.docx) files" },
  { id: "pdf-to-excel", name: "PDF to Excel", description: "Extract tables from PDF into Excel (.xlsx) spreadsheets" },
  { id: "pdf-to-powerpoint", name: "PDF to PowerPoint", description: "Convert PDF slides to editable PowerPoint (.pptx) presentations" },
  { id: "pdf-to-image", name: "PDF to Image", description: "Convert PDF pages to high-quality PNG or JPG images" },
  { id: "pdf-to-text", name: "PDF to Text", description: "Extract all text content from a PDF document" },
  { id: "word-to-pdf", name: "Word to PDF", description: "Convert Word documents (.doc, .docx) to PDF format" },
  { id: "excel-to-pdf", name: "Excel to PDF", description: "Convert Excel spreadsheets (.xlsx) to PDF format" },
  { id: "ppt-to-pdf", name: "PowerPoint to PDF", description: "Convert PowerPoint presentations (.pptx) to PDF" },
  { id: "image-to-pdf", name: "Image to PDF", description: "Convert images (PNG, JPG, etc.) to PDF documents" },
  { id: "html-to-pdf", name: "HTML to PDF", description: "Convert web pages and HTML files to PDF format" },
] as const;

/**
 * Renders the convert tools category page with a grid of available conversion tools.
 */
export default function ConvertPage() {
  return (
    <div>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 inline-flex rounded-lg bg-blue-50 p-3 text-blue-600 dark:bg-blue-950">
          <ArrowRightLeft className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Convert PDF
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Convert PDFs to and from any popular document format.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {CONVERSION_TOOLS.map((tool) => (
          <Link
            key={tool.id}
            href={`/tools/convert/${tool.id}`}
            className="group rounded-lg border border-gray-200 p-5 transition-all hover:border-blue-300 hover:shadow-sm dark:border-gray-800 dark:hover:border-blue-700"
          >
            <h2 className="font-semibold text-gray-900 group-hover:text-blue-600 dark:text-white">
              {tool.name}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {tool.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
