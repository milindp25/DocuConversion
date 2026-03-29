/**
 * Layout with SEO metadata for the Split PDF tool page.
 */

import { generateToolMetadata } from "@/lib/seo";

export const metadata = generateToolMetadata({
  title: "Split PDF",
  description: "Split a PDF into separate documents by page range. Free, fast, and no account needed.",
  path: "/tools/organize/split",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
