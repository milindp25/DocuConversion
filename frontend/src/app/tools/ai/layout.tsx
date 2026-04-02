/**
 * Layout with SEO metadata for the AI PDF Tools category page.
 */

import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "AI PDF Tools",
  description: "AI-powered PDF tools — summarize, chat, extract data, and OCR. Intelligent document processing.",
  path: "/tools/ai",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
