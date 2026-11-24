/**
 * GET /api/index/<keyword> — an Index card with its entry points resolved to Main cards. This is
 * the top-down way into the Main Box, closing the circuit from the Index side.
 *
 * A resolved card may be null: a dangling entry point is an allowed state in slice 1 (referential
 * integrity is deferred), so we return it as { address, card: null } rather than failing.
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getIndexCard, deleteIndexCard } from "@/lib/antinet/index-card-repo";
import { getMainCard } from "@/lib/antinet/main-card-repo";
import { toApiError, HttpError } from "@/lib/antinet/api-errors";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id.trim().toLowerCase();
    const handle = db();
    const card = await getIndexCard(handle, id);
    if (!card) {
      return NextResponse.json({ error: "Index card not found" }, { status: 404 });
    }
    const entries = await Promise.all(
      card.entryPoints.map(async (address) => ({ address, card: await getMainCard(handle, address) })),
    );
    return NextResponse.json({ card, entries });
  } catch (err) {
    const { status, body } = toApiError(err);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const keyword = params.id.trim().toLowerCase();
    if ((await deleteIndexCard(db(), keyword)) === 0) {
      throw new HttpError(404, "Index card not found");
    }
    return NextResponse.json({ deleted: keyword });
  } catch (err) {
    const { status, body } = toApiError(err);
    return NextResponse.json(body, { status });
  }
}
