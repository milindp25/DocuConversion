/**
 * Layout with SEO metadata for the Summarize PDF tool page.
 */

import { generateToolMetadata } from "@/lib/seo";

export const metadata = generateToolMetadata({
  title: "Summarize PDF",
  description: "Get an AI-generated summary of any PDF document. Free, fast, and no account needed.",
  path: "/tools/ai/summarize",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
