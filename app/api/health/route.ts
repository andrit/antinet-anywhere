/**
 * Health endpoint for antinet-pwa.
 *
 * Exists from the first commit because the Scaffold phase's advance criteria require proving the
 * database connection **from application code** — not from a psql prompt. This is that proof, and
 * it stays useful afterwards as the uptime-monitor target (Phase 14).
 *
 * Returns 200 when the app is up and 503 when a dependency is down, so a monitor can distinguish
 * "process alive" from "actually serving".
 */
import { NextResponse } from "next/server";
import { checkDb } from "@/lib/db";

// Always evaluated per request — a cached health check reports the past, not the present.
export const dynamic = "force-dynamic";

export async function GET() {
  const database = await checkDb();

  return NextResponse.json(
    {
      status: database.ok ? "ok" : "degraded",
      service: "antinet-pwa",
      checks: { database },
      timestamp: new Date().toISOString(),
    },
    { status: database.ok ? 200 : 503 },
  );
}
