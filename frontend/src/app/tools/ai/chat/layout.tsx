/**
 * Layout with SEO metadata for the Chat with PDF tool page.
 */

import { generateToolMetadata } from "@/lib/seo";

export const metadata = generateToolMetadata({
  title: "Chat with PDF",
  description: "Ask questions about your PDF and get instant AI-powered answers. Free, fast, and no account needed.",
  path: "/tools/ai/chat",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
