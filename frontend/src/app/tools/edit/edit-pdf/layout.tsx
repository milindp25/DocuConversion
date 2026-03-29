/**
 * Layout with SEO metadata for the Edit PDF tool page.
 */

import { generateToolMetadata } from "@/lib/seo";

export const metadata = generateToolMetadata({
  title: "Edit PDF",
  description: "Add text, highlights, and shapes to your PDF documents. Free, fast, and no account needed.",
  path: "/tools/edit/edit-pdf",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
