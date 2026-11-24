/**
 * /api/bib — POST creates a Bib card; GET browses Bib cards A–Z (optional `?letter=`).
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newBibCard } from "@/lib/antinet/bib-card";
import { insertBibCard, bibCardsByLetter } from "@/lib/antinet/bib-card-repo";
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

export async function GET(request: Request) {
  try {
    const letter = new URL(request.url).searchParams.get("letter") ?? "";
    return NextResponse.json(await bibCardsByLetter(db(), letter));
  } catch (err) {
    const { status, body } = toApiError(err);
    return NextResponse.json(body, { status });
  }
}
