/**
 * Layout with SEO metadata for the Flatten PDF tool page.
 */

import { generateToolMetadata } from "@/lib/seo";

export const metadata = generateToolMetadata({
  title: "Flatten PDF",
  description: "Flatten form fields and annotations into the PDF document. Free, fast, and no account needed.",
  path: "/tools/advanced/flatten",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
