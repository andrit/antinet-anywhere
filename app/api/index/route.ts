/**
 * POST /api/index — create an Index card (a keyword with 1–4 entry points).
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newIndexCard } from "@/lib/antinet/index-card";
import { insertIndexCard } from "@/lib/antinet/index-card-repo";
import { toApiError } from "@/lib/antinet/api-errors";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const card = newIndexCard(await request.json(), new Date());
    await insertIndexCard(db(), card);
    return NextResponse.json(card, { status: 201 });
  } catch (err) {
    const { status, body } = toApiError(err);
    return NextResponse.json(body, { status });
  }
}
