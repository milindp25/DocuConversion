/**
 * Layout with SEO metadata for the Sign PDF tool page.
 */

import { generateToolMetadata } from "@/lib/seo";

export const metadata = generateToolMetadata({
  title: "Sign PDF",
  description: "Add your electronic signature to any PDF document. Free, fast, and no account needed.",
  path: "/tools/sign/sign-pdf",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
