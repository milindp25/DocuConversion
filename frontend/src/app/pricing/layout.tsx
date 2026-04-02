/**
 * Pricing page layout — provides unique SEO metadata, FAQPage schema,
 * and BreadcrumbList structured data.
 */

import { generatePageMetadata, generateFaqJsonLd, generateBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { FAQ_ITEMS } from "@/lib/pricing-data";

export const metadata = generatePageMetadata({
  title: "Pricing — Free, Pro & Enterprise Plans",
  description:
    "Start free with 50 daily operations. Upgrade to Pro ($9/mo) or Enterprise ($29/mo) for higher limits, AI features, batch processing, and priority support.",
  path: "/pricing",
});

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={generateFaqJsonLd(FAQ_ITEMS as unknown as { question: string; answer: string }[])} />
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Pricing", path: "/pricing" },
        ])}
      />
      {children}
    </>
  );
}
