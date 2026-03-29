/**
 * Layout with SEO metadata for the Merge PDF tool page.
 */

import { generateToolMetadata } from "@/lib/seo";

export const metadata = generateToolMetadata({
  title: "Merge PDF",
  description: "Combine multiple PDF files into a single document. Free, fast, and no account needed.",
  path: "/tools/organize/merge",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
