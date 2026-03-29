/**
 * Layout with SEO metadata for the Image to PDF tool page.
 */

import { generateToolMetadata } from "@/lib/seo";

export const metadata = generateToolMetadata({
  title: "Image to PDF",
  description: "Convert image files (PNG, JPG, GIF, BMP, WebP) to PDF documents. Free, fast, and no account needed.",
  path: "/tools/convert/image-to-pdf",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
