/**
 * POST /api/bib/<slug>/notes — append a reading note (page + text) to a Bib card.
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { addReadingNote } from "@/lib/antinet/bib-card-repo";
import { AddReadingNoteSchema } from "@/lib/antinet/promote";
import { toApiError, HttpError } from "@/lib/antinet/api-errors";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const note = AddReadingNoteSchema.parse(await request.json());
    const updated = await addReadingNote(db(), params.id.trim().toLowerCase(), note);
    if (!updated) {
      throw new HttpError(404, "Bib card not found");
    }
    return NextResponse.json(updated, { status: 201 });
  } catch (err) {
    const { status, body } = toApiError(err);
    return NextResponse.json(body, { status });
  }
}
