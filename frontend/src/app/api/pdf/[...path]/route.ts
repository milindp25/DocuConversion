/**
 * API route proxy layer for PDF operations.
 * Forwards requests to the FastAPI backend, keeping the backend URL server-side only.
 * This prevents exposing internal service URLs to the browser.
 *
 * An allowlist of path prefixes prevents callers from reaching arbitrary
 * backend endpoints through this proxy.
 *
 * Auth integration: reads the NextAuth session cookie server-side and
 * forwards the session token as a Bearer token to the backend.
 */

import crypto from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";

/** Backend service URL -- server-side only, never sent to the client */
const BACKEND_URL =
  process.env.BACKEND_URL || "http://localhost:8000";

/** Only these path prefixes are forwarded to the backend */
const ALLOWED_PREFIXES = [
  "convert/",
  "edit/",
  "organize/",
  "sign/",
  "secure/",
  "preview/",
  "jobs/",
  "storage/",
  "ai/",
  "advanced/",
  "share/",
  "developer/",
];

/**
 * Validate that the requested backend path starts with an allowed prefix.
 *
 * @param backendPath - The joined path segments from the dynamic route
 * @returns true if the path is allowed, false otherwise
 */
function isAllowedPath(backendPath: string): boolean {
  return ALLOWED_PREFIXES.some((prefix) => backendPath.startsWith(prefix));
}

/**
 * Build headers for the backend request, including auth if available.
 * Reads the NextAuth session server-side and forwards the token.
 *
 * @param request - The incoming request (for content-type and any existing auth header)
 * @param contentType - The content-type to set on the outgoing request
 * @returns Headers object with content-type and optional authorization
 */
async function buildBackendHeaders(
  request: NextRequest,
  contentType: string
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "content-type": contentType,
  };

  // Forward auth: check for explicit Authorization header first (API key auth),
  // then fall back to reading the NextAuth session cookie server-side.
  const explicitAuth = request.headers.get("authorization");
  if (explicitAuth) {
    headers["authorization"] = explicitAuth;
  } else {
    try {
      const session = await auth();
      if (session?.user?.id) {
        const userId = session.user.id;
        const email = session.user.email || "";
        const tier = (session as unknown as Record<string, string>).tier || "free";

        headers["x-user-id"] = userId;
        headers["x-user-email"] = email;
        headers["x-user-name"] = session.user.name || "";
        headers["x-user-tier"] = tier;

        // HMAC-sign the user headers so the backend can verify
        // they came from the trusted proxy (not forged by a client)
        const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
        if (secret) {
          const signature = crypto
            .createHmac("sha256", secret)
            .update(`${userId}:${email}:${tier}`)
            .digest("hex");
          headers["x-user-signature"] = signature;
        }
      }
    } catch {
      // Auth not configured or session read failed — proceed anonymously
    }
  }

  return headers;
}

/**
 * Handles POST requests for PDF file uploads and processing.
 * Forwards the request body directly to the FastAPI backend
 * and streams the response back to the client.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  try {
    const { path } = await params;
    const backendPath = path.join("/");

    if (!isAllowedPath(backendPath)) {
      return NextResponse.json(
        { detail: "Not found" },
        { status: 404 }
      );
    }

    const backendUrl = `${BACKEND_URL}/api/${backendPath}`;
    const body = await request.arrayBuffer();

    const headers = await buildBackendHeaders(
      request,
      request.headers.get("content-type") || "application/octet-stream"
    );

    const backendResponse = await fetch(backendUrl, {
      method: "POST",
      headers,
      body,
    });

    const responseBody = await backendResponse.arrayBuffer();

    return new NextResponse(responseBody, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: {
        "content-type":
          backendResponse.headers.get("content-type") || "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      { detail: "An internal error occurred. Please try again." },
      { status: 502 }
    );
  }
}

/**
 * Handles GET requests for job status polling and file downloads.
 * Forwards the request to the FastAPI backend and returns the response.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  try {
    const { path } = await params;
    const backendPath = path.join("/");

    if (!isAllowedPath(backendPath)) {
      return NextResponse.json(
        { detail: "Not found" },
        { status: 404 }
      );
    }

    const backendUrl = `${BACKEND_URL}/api/${backendPath}`;

    const headers = await buildBackendHeaders(request, "application/json");

    const backendResponse = await fetch(backendUrl, {
      method: "GET",
      headers,
    });

    const responseBody = await backendResponse.arrayBuffer();

    return new NextResponse(responseBody, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: {
        "content-type":
          backendResponse.headers.get("content-type") || "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      { detail: "An internal error occurred. Please try again." },
      { status: 502 }
    );
  }
}
