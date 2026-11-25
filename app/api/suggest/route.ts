/**
 * GET /api/suggest?anchor=<address> — the next free child and sibling addresses for an anchor.
 *
 * `anchor` is a query param (not a path segment) because antinet addresses contain "/", which would
 * collide with the /api/main catch-all route. `sibling` is null for a section header.
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { addressSchema } from "@/lib/antinet/address";
import { suggestChildAddress, suggestSiblingAddress } from "@/lib/antinet/main-card-repo";
import { toApiError, HttpError } from "@/lib/antinet/api-errors";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const parsed = addressSchema.safeParse(new URL(request.url).searchParams.get("anchor") ?? "");
    if (!parsed.success) {
      throw new HttpError(400, "anchor must be a valid antinet address");
    }
    const anchor = parsed.data;
    const handle = db();
    const [child, sibling] = await Promise.all([
      suggestChildAddress(handle, anchor),
      suggestSiblingAddress(handle, anchor),
    ]);
    return NextResponse.json({ anchor, child, sibling });
  } catch (err) {
    const { status, body } = toApiError(err);
    return NextResponse.json(body, { status });
  }
}
