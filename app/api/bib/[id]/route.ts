/**
 * GET /api/bib/<slug> — a Bib card with its provenance: every Main card that cites it
 * ("everything I extracted from this source"). This closes the circuit from the Bib side.
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getBibCard, deleteBibCard } from "@/lib/antinet/bib-card-repo";
import { mainCardsCiting } from "@/lib/antinet/main-card-repo";
import { toApiError, HttpError } from "@/lib/antinet/api-errors";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id.trim().toLowerCase();
    const handle = db();
    const card = await getBibCard(handle, id);
    if (!card) {
      return NextResponse.json({ error: "Bib card not found" }, { status: 404 });
    }
    const citedBy = await mainCardsCiting(handle, id);
    return NextResponse.json({ card, citedBy });
  } catch (err) {
    const { status, body } = toApiError(err);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const slug = params.id.trim().toLowerCase();
    const handle = db();
    const citing = await mainCardsCiting(handle, slug);
    if (citing.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete: Main cards still cite this source", citedBy: citing.map((c) => c._id) },
        { status: 409 },
      );
    }
    if ((await deleteBibCard(handle, slug)) === 0) {
      throw new HttpError(404, "Bib card not found");
    }
    return NextResponse.json({ deleted: slug });
  } catch (err) {
    const { status, body } = toApiError(err);
    return NextResponse.json(body, { status });
  }
}
