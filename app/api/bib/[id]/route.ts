/**
 * GET /api/bib/<slug> — a Bib card with its provenance: every Main card that cites it
 * ("everything I extracted from this source"). This closes the circuit from the Bib side.
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getBibCard } from "@/lib/antinet/bib-card-repo";
import { mainCardsCiting } from "@/lib/antinet/main-card-repo";
import { toApiError } from "@/lib/antinet/api-errors";

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
