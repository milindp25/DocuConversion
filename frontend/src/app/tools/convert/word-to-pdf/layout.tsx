/**
 * Layout with SEO metadata for the Word to PDF tool page.
 */

import { generateToolMetadata } from "@/lib/seo";

export const metadata = generateToolMetadata({
  title: "Word to PDF",
  description: "Convert Word documents (.doc, .docx) to PDF format. Free, fast, and no account needed.",
  path: "/tools/convert/word-to-pdf",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
