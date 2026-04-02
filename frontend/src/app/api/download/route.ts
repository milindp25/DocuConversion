/**
 * Server-side download proxy.
 *
 * The browser's `download` attribute on anchor tags is silently ignored
 * for cross-origin URLs (security restriction). This route fetches the
 * file server-side (no CORS constraints) and streams it back with
 * Content-Disposition: attachment, forcing the browser to save the file.
 *
 * Security: only URLs starting with known storage origins are allowed,
 * preventing this from acting as an open proxy.
 */

import { NextRequest, NextResponse } from "next/server";

/** Validate that the URL points to a trusted storage origin.
 *  Uses hostname parsing — never substring matching — to prevent
 *  SSRF bypasses like https://evil.com/?.r2.cloudflarestorage.com */
function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;

    const backendUrl = new URL(process.env.BACKEND_URL || "http://localhost:8000");
    if (parsed.hostname === backendUrl.hostname) return true;

    // Cloudflare R2 storage — validate the actual hostname, not a substring
    if (parsed.hostname.endsWith(".r2.cloudflarestorage.com")) return true;
    if (parsed.hostname.endsWith(".r2.dev")) return true;

    return false;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const url = searchParams.get("url");
  const filename = searchParams.get("filename") || "download";

  if (!url) {
    return NextResponse.json({ detail: "Missing url parameter" }, { status: 400 });
  }

  if (!isAllowedUrl(url)) {
    return NextResponse.json({ detail: "URL not permitted" }, { status: 403 });
  }

  try {
    const upstream = await fetch(url);

    if (!upstream.ok) {
      console.error(
        `[download proxy] upstream fetch failed: url=${url} status=${upstream.status}`
      );
      return NextResponse.json(
        { detail: "Failed to fetch file from storage" },
        { status: upstream.status }
      );
    }

    const contentType =
      upstream.headers.get("content-type") || "application/octet-stream";
    const buffer = await upstream.arrayBuffer();

    // Sanitise filename to prevent header injection
    const safeName = filename.replace(/[^\w.\-() ]/g, "_");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "content-type": contentType,
        "content-disposition": `attachment; filename="${safeName}"`,
        "content-length": String(buffer.byteLength),
        // Allow the browser to cache the download response briefly
        "cache-control": "private, max-age=60",
      },
    });
  } catch (err) {
    console.error(
      `[download proxy] unexpected error: url=${url}`,
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { detail: "Download failed. Please try again." },
      { status: 502 }
    );
  }
}
