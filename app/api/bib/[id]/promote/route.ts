/**
 * POST /api/bib/<slug>/promote — promote a reading note into a new Main card.
 *
 * Cross-aggregate and non-atomic by design (see design/slice-2-promote.md): insert the Main card
 * (citing the source + the note's page), then mark the note promoted. Insert-first so a failure
 * never marks a note as pointing at a card that doesn't exist.
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getBibCard, markNotePromoted } from "@/lib/antinet/bib-card-repo";
import { insertMainCard } from "@/lib/antinet/main-card-repo";
import { newMainCard } from "@/lib/antinet/main-card";
import { PromoteSchema, selectPromotableNote, buildPromotedMainInput } from "@/lib/antinet/promote";
import { toApiError, HttpError } from "@/lib/antinet/api-errors";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const slug = params.id.trim().toLowerCase();
    const { noteIndex, main } = PromoteSchema.parse(await request.json());
    const handle = db();
    const bib = await getBibCard(handle, slug);
    if (!bib) {
      throw new HttpError(404, "Bib card not found");
    }
    const note = selectPromotableNote(bib, noteIndex);
    const card = newMainCard(buildPromotedMainInput(slug, note, main), new Date());
    await insertMainCard(handle, card);
    await markNotePromoted(handle, slug, noteIndex, card._id);
    return NextResponse.json({ main: card, bib: await getBibCard(handle, slug) }, { status: 201 });
  } catch (err) {
    const { status, body } = toApiError(err);
    return NextResponse.json(body, { status });
  }
}
