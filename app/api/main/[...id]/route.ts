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
} from "@/lib/antinet/main-card-repo";
import { toApiError } from "@/lib/antinet/api-errors";

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
