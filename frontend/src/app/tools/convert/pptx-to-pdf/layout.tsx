/**
 * Layout with SEO metadata for the PowerPoint to PDF tool page.
 */

import { generateToolMetadata } from "@/lib/seo";

export const metadata = generateToolMetadata({
  title: "PowerPoint to PDF",
  description: "Convert PowerPoint presentations (.ppt, .pptx) to PDF format. Free, fast, and no account needed.",
  path: "/tools/convert/pptx-to-pdf",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
