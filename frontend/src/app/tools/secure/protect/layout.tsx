/**
 * Layout with SEO metadata for the Protect PDF tool page.
 */

import { generateToolMetadata } from "@/lib/seo";

export const metadata = generateToolMetadata({
  title: "Protect PDF",
  description: "Add password protection to your PDF document. Free, fast, and no account needed.",
  path: "/tools/secure/protect",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
