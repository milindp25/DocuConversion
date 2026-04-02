/**
 * Pricing page layout — provides unique SEO metadata, FAQPage schema,
 * Product/Offer schema, and BreadcrumbList structured data.
 */

import { generatePageMetadata, generateFaqJsonLd, generateBreadcrumbJsonLd, SITE_URL, SITE_NAME } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { FAQ_ITEMS } from "@/lib/pricing-data";

export const metadata = generatePageMetadata({
  title: "Pricing — Free, Pro & Enterprise Plans",
  description:
    "Start free with 50 daily operations. Upgrade to Pro ($9/mo) or Enterprise ($29/mo) for higher limits, AI features, batch processing, and priority support.",
  path: "/pricing",
});

const PRICING_OFFERS_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: `${SITE_NAME} — PDF Tools`,
  description: "Free online PDF tools with optional Pro and Enterprise upgrades.",
  url: `${SITE_URL}/pricing`,
  brand: { "@id": `${SITE_URL}/#organization` },
  offers: [
    {
      "@type": "Offer",
      name: "Free",
      price: "0",
      priceCurrency: "USD",
      description: "50 operations/day, 10 MB file limit",
      url: `${SITE_URL}/pricing`,
      availability: "https://schema.org/InStock",
      priceValidUntil: "2025-12-31",
    },
    {
      "@type": "Offer",
      name: "Pro",
      price: "9",
      priceCurrency: "USD",
      billingIncrement: "P1M",
      description: "100 operations/day, 50 MB limit, AI features, batch processing",
      url: `${SITE_URL}/pricing`,
      availability: "https://schema.org/InStock",
      priceValidUntil: "2025-12-31",
    },
    {
      "@type": "Offer",
      name: "Enterprise",
      price: "29",
      priceCurrency: "USD",
      billingIncrement: "P1M",
      description: "Unlimited operations, 100 MB limit, API access, priority support",
      url: `${SITE_URL}/pricing`,
      availability: "https://schema.org/InStock",
      priceValidUntil: "2025-12-31",
    },
  ],
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={generateFaqJsonLd(FAQ_ITEMS as unknown as { question: string; answer: string }[])} />
      <JsonLd data={PRICING_OFFERS_JSONLD} />
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
