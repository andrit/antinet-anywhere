/**
 * POST /api/main — create a Main card.
 *
 * Imperative shell: validate+build via the pure `newMainCard` boundary (it parses the raw body and
 * derives the sortKey), then persist. Errors are mapped by the shared pure `toApiError`.
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newMainCard } from "@/lib/antinet/main-card";
import { insertMainCard } from "@/lib/antinet/main-card-repo";
import { toApiError } from "@/lib/antinet/api-errors";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const card = newMainCard(await request.json(), new Date());
    await insertMainCard(db(), card);
    return NextResponse.json(card, { status: 201 });
  } catch (err) {
    const { status, body } = toApiError(err);
    return NextResponse.json(body, { status });
  }
}
