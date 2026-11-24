/**
 * POST /api/bib — create a Bib card (a source).
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newBibCard } from "@/lib/antinet/bib-card";
import { insertBibCard } from "@/lib/antinet/bib-card-repo";
import { toApiError } from "@/lib/antinet/api-errors";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const card = newBibCard(await request.json(), new Date());
    await insertBibCard(db(), card);
    return NextResponse.json(card, { status: 201 });
  } catch (err) {
    const { status, body } = toApiError(err);
    return NextResponse.json(body, { status });
  }
}
