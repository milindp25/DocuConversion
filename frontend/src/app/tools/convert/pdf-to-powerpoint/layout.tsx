/**
 * Layout with SEO metadata for the PDF to PowerPoint tool page.
 */

import { generateToolMetadata } from "@/lib/seo";

export const metadata = generateToolMetadata({
  title: "PDF to PowerPoint",
  description: "Convert PDF documents to PowerPoint (.pptx) presentations. Free, fast, and no account needed.",
  path: "/tools/convert/pdf-to-powerpoint",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
