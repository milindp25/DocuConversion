/**
 * Pricing page for DocuConversion.
 * Displays three subscription tiers (Free, Pro, Enterprise) with feature
 * comparison and an FAQ accordion. Matches the dark gradient aesthetic
 * established on the landing page.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Check,
  X,
  ChevronDown,
  Sparkles,
  Zap,
  Building2,
  Loader2,
  CreditCard,
} from "lucide-react";

/** Shape of a single FAQ item */
export interface FaqItem {
  question: string;
  answer: string;
}

/** Shape of a feature row in the pricing table */
export interface PricingFeature {
  label: string;
  free: string | boolean;
  pro: string | boolean;
  enterprise: string | boolean;
}

/** Shape of a pricing tier card */
export interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  borderColor: string;
  ctaLabel: string;
  ctaHref: string;
  ctaStyle: string;
  ctaPlan?: string;
  icon: React.ElementType;
  iconColor: string;
  features: PricingFeature[];
}

/** Feature rows displayed on all three pricing cards */
const FEATURES: PricingFeature[] = [
  { label: "File size limit", free: "10 MB", pro: "50 MB", enterprise: "100 MB" },
  { label: "Daily operations", free: "5", pro: "100", enterprise: "Unlimited" },
  { label: "AI features", free: false, pro: "20/day", enterprise: "Unlimited" },
  { label: "Batch processing", free: false, pro: true, enterprise: true },
  { label: "File history", free: false, pro: "30 days", enterprise: "Unlimited" },
  { label: "Saved signatures", free: false, pro: "10", enterprise: "Unlimited" },
  { label: "API access", free: false, pro: false, enterprise: true },
  { label: "Priority processing", free: false, pro: false, enterprise: true },
  { label: "Share links", free: "3/day", pro: "50/day", enterprise: "Unlimited" },
  { label: "Support", free: "Community", pro: "Email", enterprise: "Priority" },
];

/** The three pricing tiers */
const TIERS: PricingTier[] = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for occasional use. No credit card required.",
    borderColor: "border-gray-800",
    ctaLabel: "Get started",
    ctaHref: "/signup",
    ctaStyle:
      "border border-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-800/50 hover:text-white",
    icon: Zap,
    iconColor: "text-gray-400",
    features: FEATURES,
  },
  {
    name: "Pro",
    price: "$9",
    period: "/month",
    description: "For professionals who need reliable, high-volume PDF tools.",
    badge: "Most Popular",
    badgeColor: "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20",
    borderColor: "border-blue-500/50",
    ctaLabel: "Start free trial",
    ctaHref: "/signup",
    ctaStyle: "bg-blue-600 text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500",
    ctaPlan: "pro",
    icon: Sparkles,
    iconColor: "text-blue-400",
    features: FEATURES,
  },
  {
    name: "Enterprise",
    price: "$29",
    period: "/month",
    description: "Unlimited everything plus API access and priority support.",
    badge: "Best Value",
    badgeColor: "bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20",
    borderColor: "border-indigo-500/50",
    ctaLabel: "Contact sales",
    ctaHref: "mailto:sales@docuconversion.com",
    ctaStyle:
      "border border-indigo-500/50 text-indigo-300 hover:border-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-200",
    icon: Building2,
    iconColor: "text-indigo-400",
    features: FEATURES,
  },
];

/** FAQ data imported from shared module (also used by layout.tsx for JSON-LD) */
import { FAQ_ITEMS } from "@/lib/pricing-data";

/**
 * Renders the value for a feature cell.
 * Booleans render as check/x icons; strings render as text labels.
 */
function FeatureValue({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <Check className="h-4 w-4 text-green-400" aria-label="Included" />
    );
  }
  if (value === false) {
    return (
      <X className="h-4 w-4 text-gray-600" aria-label="Not included" />
    );
  }
  return (
    <span className="text-sm text-gray-300">{value}</span>
  );
}

/**
 * Accordion item for the FAQ section.
 */
function FaqAccordion({
  item,
  isOpen,
  onToggle,
}: {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-gray-800 last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between py-5 text-left"
        aria-expanded={isOpen}
      >
        <span className="text-base font-medium text-white">{item.question}</span>
        <ChevronDown
          className={`h-5 w-5 flex-shrink-0 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-40 pb-5" : "max-h-0"
        }`}
        role="region"
      >
        <p className="text-sm leading-relaxed text-gray-400">{item.answer}</p>
      </div>
    </div>
  );
}

/**
 * Pricing page component.
 * Renders three tier cards and an FAQ section.
 * Handles Stripe checkout for the Pro plan.
 */
export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [stripeConfigured, setStripeConfigured] = useState<boolean>(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/pdf/payments/status")
      .then((res) => res.json())
      .then((data) => setStripeConfigured(data.configured === true))
      .catch(() => setStripeConfigured(false));
  }, []);

  const handleCheckout = useCallback(async (plan: string) => {
    setCheckoutLoading(plan);
    setCheckoutError(null);

    try {
      const formData = new FormData();
      formData.append("plan", plan);

      const res = await fetch("/api/pdf/payments/create-checkout", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to create checkout session.");
      }

      const data = await res.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (err) {
      setCheckoutError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setCheckoutLoading(null);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2" aria-hidden="true">
          <div className="h-[400px] w-[600px] rounded-full bg-gradient-to-tr from-blue-600/10 via-violet-600/5 to-transparent blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-4 pt-20 text-center sm:px-6 sm:pt-28 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Simple, transparent{" "}
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              pricing
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-lg text-gray-400">
            Start free. Upgrade when you need more.
          </p>
        </div>
      </section>

      {/* Checkout error banner */}
      {checkoutError && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-300">
            {checkoutError}
          </div>
        </div>
      )}

      {/* Stripe notice */}
      <div className="mx-auto max-w-7xl px-4 pt-4 text-center sm:px-6 lg:px-8">
        <p className="inline-flex items-center gap-2 rounded-full bg-gray-800/60 px-4 py-2 text-xs text-gray-400 ring-1 ring-gray-700/50">
          <CreditCard className="h-3.5 w-3.5" />
          Stripe checkout will redirect you to a secure payment page
        </p>
      </div>

      {/* Pricing Cards */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {TIERS.map((tier, tierIndex) => {
            const tierKey = tierIndex === 0 ? "free" : tierIndex === 1 ? "pro" : "enterprise";
            const isStripeCheckout = !!tier.ctaPlan;
            const isLoading = checkoutLoading === tier.ctaPlan;

            return (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-2xl border ${tier.borderColor} bg-gray-900/60 p-8 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 ${
                  tierIndex === 1 ? "-translate-y-2 shadow-lg shadow-blue-500/10" : ""
                }`}
              >
                {/* Badge */}
                {tier.badge && (
                  <span
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-semibold ${tier.badgeColor}`}
                  >
                    {tier.badge}
                  </span>
                )}

                {/* Tier header */}
                <div className="mb-6 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-800/50">
                    <tier.icon className={`h-6 w-6 ${tier.iconColor}`} />
                  </div>
                  <h2 className="text-xl font-bold text-white" aria-label={`${tier.name} plan`}>{tier.name}</h2>
                  <div className="mt-3 flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-extrabold text-white">{tier.price}</span>
                    <span className="text-sm text-gray-400">{tier.period}</span>
                  </div>
                  <p className="mt-3 text-sm text-gray-400">{tier.description}</p>
                </div>

                {/* CTA */}
                {isStripeCheckout ? (
                  <button
                    type="button"
                    onClick={() => handleCheckout(tier.ctaPlan!)}
                    disabled={!stripeConfigured || isLoading}
                    className={`mb-8 flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-center text-sm font-semibold transition-all duration-200 ${tier.ctaStyle} disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Redirecting...
                      </>
                    ) : (
                      tier.ctaLabel
                    )}
                  </button>
                ) : (
                  <Link
                    href={tier.ctaHref}
                    className={`mb-8 block rounded-xl px-6 py-3 text-center text-sm font-semibold transition-all duration-200 ${tier.ctaStyle}`}
                  >
                    {tier.ctaLabel}
                  </Link>
                )}

                {/* Feature list */}
                <div className="flex-1 space-y-3">
                  {FEATURES.map((feature) => {
                    const value = feature[tierKey as keyof Pick<PricingFeature, "free" | "pro" | "enterprise">];
                    return (
                      <div
                        key={feature.label}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="text-sm text-gray-400">{feature.label}</span>
                        <FeatureValue value={value} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mx-auto max-w-3xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-center text-2xl font-semibold text-white">
          Frequently asked questions
        </h2>
        <div className="rounded-2xl border border-gray-800 bg-gray-900/60 px-6 backdrop-blur-sm">
          {FAQ_ITEMS.map((item, index) => (
            <FaqAccordion
              key={item.question}
              item={item}
              isOpen={openFaq === index}
              onToggle={() => setOpenFaq(openFaq === index ? null : index)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
