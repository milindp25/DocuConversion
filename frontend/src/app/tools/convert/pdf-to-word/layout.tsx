/**
 * Layout with SEO metadata for the PDF to Word tool page.
 */

import { generateToolMetadata } from "@/lib/seo";

export const metadata = generateToolMetadata({
  title: "PDF to Word",
  description: "Convert PDF documents to editable Word (.docx) files. Free, fast, and no account needed.",
  path: "/tools/convert/pdf-to-word",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
