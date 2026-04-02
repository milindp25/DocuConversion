/**
 * Shared pricing data used by both the pricing page (client) and
 * the pricing layout (server, for metadata + JSON-LD).
 */

/** FAQ items for the pricing page */
export const FAQ_ITEMS = [
  {
    question: "Can I switch plans anytime?",
    answer:
      "Yes! You can upgrade or downgrade your plan at any time. When upgrading, your new features are available immediately. When downgrading, your current plan remains active until the end of the billing period.",
  },
  {
    question: "What happens when I exceed the limit?",
    answer:
      "You will receive a notification when you are approaching your daily limit. Once you hit the cap, additional operations are queued until the next day or you can upgrade your plan for immediate access.",
  },
  {
    question: "Is there a student discount?",
    answer:
      "We offer a 50% discount on the Pro plan for students and educators with a valid .edu email address. Contact our support team with proof of enrollment to get your discount code.",
  },
  {
    question: "How does the free trial work?",
    answer:
      "The Pro plan comes with a 14-day free trial. No credit card is required to start. You get full access to all Pro features during the trial period, and you can cancel anytime before the trial ends.",
  },
] as const;
