/**
 * Privacy Policy page for DocuConversion.
 * Static server component with professional legal-style content
 * covering data collection, file processing, retention, and user rights.
 */

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | DocuConversion",
  description:
    "Learn how DocuConversion handles your data, files, and privacy. We process files server-side and auto-delete them for your protection.",
};

/** Section heading component for consistent styling */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 mt-10 text-xl font-semibold text-white first:mt-0">
      {children}
    </h2>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="mb-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-gray-500">
          Last updated: March 28, 2026
        </p>
      </header>

      <div className="prose-invert space-y-6 text-sm leading-relaxed text-gray-400">
        <p>
          DocuConversion (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is
          committed to protecting your privacy. This Privacy Policy explains
          what data we collect, how we use it, and your rights regarding your
          information when you use our website and services at{" "}
          <span className="text-gray-300">docuconversion.com</span>.
        </p>

        <SectionHeading>1. Data We Collect</SectionHeading>
        <p>We collect the following categories of information:</p>
        <ul className="ml-4 list-disc space-y-2 pl-4 marker:text-gray-600">
          <li>
            <span className="font-medium text-gray-300">
              Files you upload
            </span>{" "}
            — PDF and document files submitted for conversion, editing, or
            other processing. These are stored temporarily and automatically
            deleted (see Section 3).
          </li>
          <li>
            <span className="font-medium text-gray-300">
              Account information
            </span>{" "}
            — If you create an account: your name, email address, and
            authentication provider details (e.g., Google, GitHub).
          </li>
          <li>
            <span className="font-medium text-gray-300">
              Browser and device data
            </span>{" "}
            — Browser type, operating system, screen resolution, and IP address.
            This is collected automatically via standard HTTP headers.
          </li>
          <li>
            <span className="font-medium text-gray-300">Usage data</span> —
            Pages visited, tools used, and conversion types. We do not track
            individual keystrokes or file contents.
          </li>
        </ul>

        <SectionHeading>2. How We Process Files</SectionHeading>
        <p>
          All file processing happens server-side on our secured
          infrastructure. We do not read, analyze, or access the content of
          your files for any purpose beyond performing the requested operation
          (e.g., PDF-to-Word conversion). Files are never shared with third
          parties except as described in Section 4.
        </p>

        <SectionHeading>3. File Retention Policy</SectionHeading>
        <ul className="ml-4 list-disc space-y-2 pl-4 marker:text-gray-600">
          <li>
            <span className="font-medium text-gray-300">
              Anonymous users (no account)
            </span>{" "}
            — Uploaded files and processed output files are automatically
            deleted within <strong className="text-gray-300">1 hour</strong>{" "}
            of processing.
          </li>
          <li>
            <span className="font-medium text-gray-300">
              Authenticated users
            </span>{" "}
            — Files are retained for up to{" "}
            <strong className="text-gray-300">30 days</strong> to allow you
            to re-download results from your dashboard. You may manually
            delete files at any time.
          </li>
        </ul>

        <SectionHeading>4. Third-Party Services</SectionHeading>
        <p>We use the following third-party services to operate DocuConversion:</p>
        <ul className="ml-4 list-disc space-y-2 pl-4 marker:text-gray-600">
          <li>
            <span className="font-medium text-gray-300">Cloudflare R2</span>{" "}
            — Object storage for temporary file hosting. Files are encrypted
            at rest and in transit.
          </li>
          <li>
            <span className="font-medium text-gray-300">Google Gemini</span>{" "}
            — Powers AI features (summarization, chat, extraction, OCR). When
            you use AI tools, the content of your uploaded file is sent to
            Google&apos;s API for processing. Google&apos;s data handling
            policies apply to that processing.
          </li>
          <li>
            <span className="font-medium text-gray-300">
              Authentication providers
            </span>{" "}
            — Google and GitHub OAuth for account sign-in. We only receive
            your name and email from these providers.
          </li>
        </ul>

        <SectionHeading>5. Cookies</SectionHeading>
        <p>
          DocuConversion uses only essential cookies required for the service
          to function:
        </p>
        <ul className="ml-4 list-disc space-y-2 pl-4 marker:text-gray-600">
          <li>
            <span className="font-medium text-gray-300">
              NextAuth session cookie
            </span>{" "}
            — Maintains your login session. This cookie is httpOnly, secure,
            and strictly necessary.
          </li>
        </ul>
        <p>
          We do not use advertising cookies, analytics trackers, or any
          third-party tracking scripts.
        </p>

        <SectionHeading>6. Your Rights (GDPR)</SectionHeading>
        <p>
          If you are located in the European Economic Area (EEA), you have
          the following rights under the General Data Protection Regulation:
        </p>
        <ul className="ml-4 list-disc space-y-2 pl-4 marker:text-gray-600">
          <li>
            <span className="font-medium text-gray-300">Right of access</span>{" "}
            — Request a copy of all personal data we hold about you.
          </li>
          <li>
            <span className="font-medium text-gray-300">
              Right to deletion
            </span>{" "}
            — Request permanent deletion of your account and all associated
            data.
          </li>
          <li>
            <span className="font-medium text-gray-300">
              Right to data portability
            </span>{" "}
            — Export your data in a machine-readable format.
          </li>
          <li>
            <span className="font-medium text-gray-300">
              Right to rectification
            </span>{" "}
            — Correct inaccurate personal data.
          </li>
          <li>
            <span className="font-medium text-gray-300">
              Right to restrict processing
            </span>{" "}
            — Limit how we use your data.
          </li>
        </ul>
        <p>
          To exercise any of these rights, please contact us using the details
          below.
        </p>

        <SectionHeading>7. Data Security</SectionHeading>
        <p>
          We implement industry-standard security measures including TLS
          encryption for all data in transit, encryption at rest for stored
          files, and regular security audits of our infrastructure. Access
          to production systems is restricted to authorized personnel only.
        </p>

        <SectionHeading>8. Changes to This Policy</SectionHeading>
        <p>
          We may update this Privacy Policy from time to time. When we do, we
          will update the &quot;Last updated&quot; date at the top of this
          page. Continued use of DocuConversion after changes constitutes
          acceptance of the updated policy.
        </p>

        <SectionHeading>9. Contact</SectionHeading>
        <p>
          If you have questions about this Privacy Policy or wish to exercise
          your data rights, please contact us at:
        </p>
        <p className="text-gray-300">
          privacy@docuconversion.com
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
