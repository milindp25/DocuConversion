/**
 * Layout with SEO metadata for the Compare PDFs tool page.
 */

import { generateToolMetadata } from "@/lib/seo";

export const metadata = generateToolMetadata({
  title: "Compare PDFs",
  description: "Compare two PDF documents and see the differences highlighted. Free, fast, and no account needed.",
  path: "/tools/advanced/compare",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
