/**
 * GET /api/main/<address> — a Main card with its circuit context.
 *
 * A catch-all segment because antinet addresses contain "/" (e.g. 3200/4B1), which a single `[id]`
 * segment would not match. Returns the card (citations + links embedded) plus its backlinks, direct
 * children (the Create-modal neighbor context), and previous/next cards for box-flipping.
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { addressSchema } from "@/lib/antinet/address";
import {
  getMainCard,
  backlinksTo,
  childrenOf,
  nextCard,
  prevCard,
  deleteMainCard,
  pullLinkFromAll,
} from "@/lib/antinet/main-card-repo";
import {
  indexCardsWithEntryPoint,
  pullEntryPointFromAll,
  deleteEmptyIndexCards,
} from "@/lib/antinet/index-card-repo";
import { partitionIndexRefs } from "@/lib/antinet/integrity";
import { toApiError, HttpError } from "@/lib/antinet/api-errors";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string[] } }) {
  try {
    const parsed = addressSchema.safeParse(params.id.join("/"));
    if (!parsed.success) {
      return NextResponse.json({ error: "Not a valid antinet address" }, { status: 404 });
    }
    const id = parsed.data;
    const handle = db();
    const card = await getMainCard(handle, id);
    if (!card) {
      return NextResponse.json({ error: "Main card not found" }, { status: 404 });
    }
    const [backlinks, children, prev, next] = await Promise.all([
      backlinksTo(handle, id),
      childrenOf(handle, id),
      prevCard(handle, id),
      nextCard(handle, id),
    ]);
    return NextResponse.json({ card, backlinks, children, prev, next });
  } catch (err) {
    const { status, body } = toApiError(err);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string[] } }) {
  try {
    const parsed = addressSchema.safeParse(params.id.join("/"));
    if (!parsed.success) {
      throw new HttpError(404, "Not a valid antinet address");
    }
    const id = parsed.data;
    const handle = db();
    if ((await deleteMainCard(handle, id)) === 0) {
      throw new HttpError(404, "Main card not found");
    }
    // Clean up references: heal backlinks, pull from entry points, drop any now-empty Index cards.
    const { deleteKeywords, pullKeywords } = partitionIndexRefs(await indexCardsWithEntryPoint(handle, id));
    const unlinkedFrom = await pullLinkFromAll(handle, id);
    await pullEntryPointFromAll(handle, id);
    await deleteEmptyIndexCards(handle);
    return NextResponse.json({
      deleted: id,
      unlinkedFrom,
      entryPointRemovedFrom: pullKeywords,
      indexCardsDeleted: deleteKeywords,
    });
  } catch (err) {
    const { status, body } = toApiError(err);
    return NextResponse.json(body, { status });
  }
}
