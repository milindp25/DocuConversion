/**
 * Layout with SEO metadata for the Convert PDF category page.
 */

import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Convert PDF",
  description: "Convert PDFs to Word, Excel, PowerPoint, images, and more. Free online PDF conversion tools.",
  path: "/tools/convert",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
