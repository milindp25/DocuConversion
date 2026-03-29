/**
 * Layout with SEO metadata for the Compress PDF tool page.
 */

import { generateToolMetadata } from "@/lib/seo";

export const metadata = generateToolMetadata({
  title: "Compress PDF",
  description: "Reduce PDF file size while maintaining quality. Free, fast, and no account needed.",
  path: "/tools/organize/compress",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
