/**
 * Terms of Service page for DocuConversion.
 * Static server component with professional legal-style content
 * covering acceptable use, liability, billing, and account policies.
 */

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | DocuConversion",
  description:
    "Terms of Service for DocuConversion. Covers acceptable use, file ownership, service availability, pricing, and liability limitations.",
};

/** Section heading component for consistent styling */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 mt-10 text-xl font-semibold text-white first:mt-0">
      {children}
    </h2>
  );
}

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="mb-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-3 text-sm text-gray-500">
          Last updated: March 28, 2026
        </p>
      </header>

      <div className="prose-invert space-y-6 text-sm leading-relaxed text-gray-400">
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your use of
          DocuConversion (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;)
          available at{" "}
          <span className="text-gray-300">docuconversion.com</span>. By
          accessing or using our services, you agree to be bound by these
          Terms.
        </p>

        <SectionHeading>1. Acceptable Use</SectionHeading>
        <p>You agree to use DocuConversion only for lawful purposes. You must not:</p>
        <ul className="ml-4 list-disc space-y-2 pl-4 marker:text-gray-600">
          <li>
            Upload files that contain malware, viruses, or any malicious code.
          </li>
          <li>
            Process documents containing illegal content, including but not
            limited to child exploitation material, stolen intellectual
            property, or content that violates applicable laws.
          </li>
          <li>
            Attempt to reverse-engineer, decompile, or exploit the service
            infrastructure.
          </li>
          <li>
            Use automated scripts or bots to access the service in a manner
            that exceeds reasonable use or degrades service quality for
            others.
          </li>
          <li>
            Circumvent rate limits, file size limits, or other usage
            restrictions.
          </li>
        </ul>

        <SectionHeading>2. Service Availability</SectionHeading>
        <p>
          DocuConversion is provided on a &quot;best effort&quot; basis. We
          strive for high availability but do not guarantee uninterrupted
          access to the service. Specifically:
        </p>
        <ul className="ml-4 list-disc space-y-2 pl-4 marker:text-gray-600">
          <li>
            <span className="font-medium text-gray-300">Free tier</span> — No
            service level agreement (SLA) is offered. We may throttle or
            limit access during periods of high demand.
          </li>
          <li>
            <span className="font-medium text-gray-300">Premium tier</span> —
            We aim for 99.9% uptime but this is a target, not a contractual
            guarantee.
          </li>
          <li>
            We reserve the right to perform scheduled maintenance with
            reasonable advance notice when possible.
          </li>
        </ul>

        <SectionHeading>3. File Ownership</SectionHeading>
        <p>
          You retain full ownership of all files you upload to DocuConversion.
          We do not claim any intellectual property rights over your content.
          We do not store, access, read, or analyze the content of your files
          for any purpose other than performing the specific operation you
          request. Uploaded files are automatically deleted according to our{" "}
          <Link
            href="/privacy"
            className="text-blue-400 underline decoration-blue-400/30 transition-colors hover:text-blue-300"
          >
            Privacy Policy
          </Link>
          .
        </p>

        <SectionHeading>4. Limitation of Liability</SectionHeading>
        <p>
          To the maximum extent permitted by applicable law, DocuConversion
          and its operators shall not be liable for:
        </p>
        <ul className="ml-4 list-disc space-y-2 pl-4 marker:text-gray-600">
          <li>
            Any indirect, incidental, special, consequential, or punitive
            damages arising from your use of the service.
          </li>
          <li>
            Loss or corruption of files during processing. We recommend
            keeping a backup copy of any important documents before
            uploading.
          </li>
          <li>
            Inaccuracies in AI-generated outputs (summaries, extracted data,
            OCR text).
          </li>
          <li>
            Service interruptions, downtime, or data loss resulting from
            circumstances beyond our reasonable control.
          </li>
        </ul>
        <p>
          Our total liability for any claim relating to the service shall not
          exceed the amount you paid us in the 12 months preceding the claim,
          or $50 USD, whichever is greater.
        </p>

        <SectionHeading>5. Pricing and Billing</SectionHeading>
        <ul className="ml-4 list-disc space-y-2 pl-4 marker:text-gray-600">
          <li>
            The free tier provides limited daily operations with no payment
            required.
          </li>
          <li>
            Premium subscriptions are billed monthly or annually as selected
            at the time of purchase. Prices are displayed on our{" "}
            <Link
              href="/pricing"
              className="text-blue-400 underline decoration-blue-400/30 transition-colors hover:text-blue-300"
            >
              Pricing page
            </Link>
            .
          </li>
          <li>
            We reserve the right to change pricing with 30 days advance
            notice. Existing subscribers will be notified by email before
            any price change takes effect on their next billing cycle.
          </li>
          <li>
            Refunds are handled on a case-by-case basis. Contact support
            within 14 days of a charge for refund consideration.
          </li>
        </ul>

        <SectionHeading>6. Account Termination</SectionHeading>
        <ul className="ml-4 list-disc space-y-2 pl-4 marker:text-gray-600">
          <li>
            You may delete your account at any time from your account
            settings. Deletion is permanent and removes all stored files and
            personal data.
          </li>
          <li>
            We reserve the right to suspend or terminate accounts that violate
            these Terms, engage in abusive behavior, or use the service in a
            manner that threatens the security or stability of our
            infrastructure.
          </li>
          <li>
            Upon termination, any remaining subscription time is forfeited
            unless the termination was initiated by us without cause.
          </li>
        </ul>

        <SectionHeading>7. Age Requirement</SectionHeading>
        <p>
          You must be at least 13 years old (or 16 in the European Economic
          Area) to use DocuConversion. By using the service, you represent that
          you meet this age requirement. If we learn that we have collected
          personal data from a child under the applicable minimum age, we will
          delete that data promptly.
        </p>

        <SectionHeading>8. Changes to Terms</SectionHeading>
        <p>
          We may update these Terms from time to time. When we make material
          changes, we will update the &quot;Last updated&quot; date at the
          top of this page and, for registered users, send an email
          notification. Continued use of DocuConversion after changes
          constitutes acceptance of the updated Terms.
        </p>

        <SectionHeading>9. Governing Law</SectionHeading>
        <p>
          These Terms are governed by and construed in accordance with
          applicable law. Any disputes arising from these Terms or your use
          of the service shall be resolved through good-faith negotiation
          first, and if necessary, through binding arbitration.
        </p>

        <SectionHeading>10. Contact</SectionHeading>
        <p>
          If you have questions about these Terms of Service, please contact
          us at:
        </p>
        <p className="text-gray-300">
          legal@docuconversion.com
        </p>

        <div className="mt-12 border-t border-gray-800 pt-8 text-center">
          <Link
            href="/"
            className="text-sm font-medium text-blue-400 transition-colors hover:text-blue-300"
          >
            &larr; Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
