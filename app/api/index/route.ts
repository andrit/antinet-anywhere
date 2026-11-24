/**
 * /api/index — POST creates an Index card; GET browses Index cards A–Z (optional `?letter=`).
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newIndexCard } from "@/lib/antinet/index-card";
import { insertIndexCard, indexCardsByLetter } from "@/lib/antinet/index-card-repo";
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

export async function GET(request: Request) {
  try {
    const letter = new URL(request.url).searchParams.get("letter") ?? "";
    return NextResponse.json(await indexCardsByLetter(db(), letter));
  } catch (err) {
    const { status, body } = toApiError(err);
    return NextResponse.json(body, { status });
  }
}
