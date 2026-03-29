/**
 * Layout with SEO metadata for the OCR tool page.
 */

import { generateToolMetadata } from "@/lib/seo";

export const metadata = generateToolMetadata({
  title: "OCR",
  description: "Extract text from scanned PDFs and images using optical character recognition. Free, fast, and no account needed.",
  path: "/tools/ai/ocr",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
