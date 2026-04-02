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

/** Allowed URL prefixes — backend local dev and Cloudflare R2 */
function isAllowedUrl(url: string): boolean {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
  return (
    url.startsWith(backendUrl) ||
    url.includes(".r2.cloudflarestorage.com") ||
    url.includes(".cloudflare.com")
  );
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
