/**
 * Dynamic OG image for DocuConversion.
 * Generated at build time by Next.js and served as the default OpenGraph
 * image for all pages that don't define their own.
 */

import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "DocuConversion — Free Online PDF Tools";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-2px",
            marginBottom: 16,
          }}
        >
          DocuConversion
        </div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 400,
            background: "linear-gradient(90deg, #60a5fa, #a78bfa)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Free Online PDF Tools
        </div>
        <div
          style={{
            display: "flex",
            gap: 24,
            marginTop: 48,
            fontSize: 20,
            color: "#94a3b8",
          }}
        >
          <span>Convert</span>
          <span style={{ color: "#475569" }}>·</span>
          <span>Edit</span>
          <span style={{ color: "#475569" }}>·</span>
          <span>Sign</span>
          <span style={{ color: "#475569" }}>·</span>
          <span>Organize</span>
          <span style={{ color: "#475569" }}>·</span>
          <span>AI</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
