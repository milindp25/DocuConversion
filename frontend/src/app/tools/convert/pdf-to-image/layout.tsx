/**
 * Layout with SEO metadata for the PDF to Image tool page.
 */

import { generateToolMetadata } from "@/lib/seo";

export const metadata = generateToolMetadata({
  title: "PDF to Image",
  description: "Convert PDF pages into high-quality PNG or JPG images. Free, fast, and no account needed.",
  path: "/tools/convert/pdf-to-image",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
