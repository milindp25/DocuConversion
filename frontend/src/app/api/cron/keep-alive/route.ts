/**
 * Vercel Cron keep-alive route.
 * Pings the backend /health endpoint to prevent Render free tier from sleeping.
 *
 * Triggered by Vercel Cron (vercel.json) or externally via UptimeRobot.
 * Protected by CRON_SECRET when called via Vercel Cron.
 */

import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest): Promise<NextResponse> {
  // When called via Vercel Cron, verify the secret to block unauthorized callers.
  // When called externally (UptimeRobot), CRON_SECRET won't be set — skip check.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(30_000),
    });

    const data = await response.json();

    // TODO (Your turn!): Decide what happens when the health check fails.
    //
    // Right now we just return the status. You could:
    //   Option A: Log and return error status (current behavior — simplest)
    //   Option B: Send a notification (e.g., POST to a Slack webhook or Discord)
    //   Option C: Retry once before giving up
    //
    // Implement your preferred failure strategy here:
    if (!response.ok) {
      return NextResponse.json(
        { status: "unhealthy", backend: data, timestamp: new Date().toISOString() },
        { status: 502 }
      );
    }

    return NextResponse.json({
      status: "ok",
      backend: data,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { status: "unreachable", timestamp: new Date().toISOString() },
      { status: 502 }
    );
  }
}
