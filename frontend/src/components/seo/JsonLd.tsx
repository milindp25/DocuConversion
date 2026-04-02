/**
 * JSON-LD structured data component for SEO.
 * Renders a <script type="application/ld+json"> tag with the provided
 * structured data object. Used to add Organization, WebApplication,
 * and SoftwareApplication schemas to pages.
 */

/** Props for the JsonLd component */
export interface JsonLdProps {
  /** The structured data object conforming to a Schema.org type */
  data: Record<string, unknown>;
}

/**
 * Server component that injects JSON-LD structured data into the page head.
 * Serializes the provided data object into a script tag that search engines
 * can parse for rich results.
 *
 * The data prop is always a trusted, statically-defined Schema.org object
 * constructed in our own codebase — never from user input. JSON.stringify
 * safely encodes the object without risk of script injection.
 *
 * @example
 * ```tsx
 * <JsonLd data={{
 *   "@context": "https://schema.org",
 *   "@type": "WebApplication",
 *   "name": "DocuConversion",
 * }} />
 * ```
 */
export function JsonLd({ data }: JsonLdProps) {
  const jsonString = JSON.stringify(data);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonString }}
    />
  );
}
