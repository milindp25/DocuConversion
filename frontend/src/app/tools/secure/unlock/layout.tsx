/**
 * Layout with SEO metadata for the Unlock PDF tool page.
 */

import { generateToolMetadata } from "@/lib/seo";

export const metadata = generateToolMetadata({
  title: "Unlock PDF",
  description: "Remove password protection from a PDF document. Free, fast, and no account needed.",
  path: "/tools/secure/unlock",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
