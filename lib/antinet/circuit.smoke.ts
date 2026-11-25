/**
 * End-to-end smoke test for the slice-1 circuit: stands up a real (in-memory) MongoDB and drives the
 * actual API route handlers, proving the whole loop turns against a live database — create in each
 * box, then traverse (children, backlinks, citations, entry points, box-flipping) and the error
 * paths (409 duplicate, 400 invalid, 404 missing).
 *
 * Not part of `npm run verify`. Run with: npx vitest run --config vitest.smoke.config.ts
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";

import { POST as createMain } from "@/app/api/main/route";
import { GET as getMain, DELETE as deleteMainRoute } from "@/app/api/main/[...id]/route";
import { POST as createBib, GET as listBib } from "@/app/api/bib/route";
import { GET as getBib, DELETE as deleteBibRoute } from "@/app/api/bib/[id]/route";
import { POST as createIndex, GET as listIndex } from "@/app/api/index/route";
import { GET as getIndex, DELETE as deleteIndexRoute } from "@/app/api/index/[id]/route";
import { POST as addNote } from "@/app/api/bib/[id]/notes/route";
import { POST as promoteNote } from "@/app/api/bib/[id]/promote/route";
import { GET as suggestRoute } from "@/app/api/suggest/route";
import { db } from "@/lib/db";
import { ensureAntinetIndexes, mainCards } from "@/lib/antinet/collections";

let mongod: MongoMemoryServer;

beforeAll(async () => {
  // MongoDB doesn't publish a debian12-aarch64 build for the memory-server's default version, so on
  // Linux arm64 we pin an Ubuntu 22.04 build, which does have arm64 releases. Override either with
  // MONGOMS_DISTRO / MONGOMS_VERSION; other platforms auto-detect normally.
  if (process.platform === "linux" && process.arch === "arm64" && !process.env.MONGOMS_DISTRO) {
    process.env.MONGOMS_DISTRO = "ubuntu-22.04";
  }
  mongod = await MongoMemoryServer.create({
    binary: { version: process.env.MONGOMS_VERSION ?? "7.0.14" },
  });
  process.env.DATABASE_URL = mongod.getUri();
  process.env.DB_NAME = "antinet_smoke";
});

afterAll(async () => {
  await mongod?.stop();
});

const post = (handler: (r: Request) => Promise<Response>, body: unknown): Promise<Response> =>
  handler(
    new Request("http://smoke/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

const getById = (
  handler: (r: Request, ctx: { params: { id: string } }) => Promise<Response>,
  id: string,
): Promise<Response> => handler(new Request("http://smoke/"), { params: { id } });

const getMainByAddress = (segments: string[]): Promise<Response> =>
  getMain(new Request("http://smoke/"), { params: { id: segments } });

const postTo = (
  handler: (r: Request, ctx: { params: { id: string } }) => Promise<Response>,
  id: string,
  body: unknown,
): Promise<Response> =>
  handler(
    new Request("http://smoke/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: { id } },
  );

const deleteById = (
  handler: (r: Request, ctx: { params: { id: string } }) => Promise<Response>,
  id: string,
): Promise<Response> => handler(new Request("http://smoke/", { method: "DELETE" }), { params: { id } });

const deleteMainByAddress = (segments: string[]): Promise<Response> =>
  deleteMainRoute(new Request("http://smoke/", { method: "DELETE" }), { params: { id: segments } });

const getList = (handler: (r: Request) => Promise<Response>, query: string): Promise<Response> =>
  handler(new Request(`http://smoke/?${query}`));

describe("the antinet circuit (live MongoDB)", () => {
  it("turns end to end: create across all three boxes, then traverse", async () => {
    // --- Startup indexes (what instrumentation.node.ts runs on boot) create the real indexes ---
    await ensureAntinetIndexes(db());
    const mainIndexes = await mainCards(db()).listIndexes().toArray();
    expect(mainIndexes.some((i) => i.key?.sortKey === 1)).toBe(true);

    // --- Create a source in the Bib Box ---
    expect((await post(createBib, {
      _id: "kahneman_2011",
      authorSort: "Kahneman, Daniel",
      title: "Thinking, Fast and Slow",
      year: 2011,
    })).status).toBe(201);

    // --- Create Main cards: a root note and two children; one child cites the source and links up ---
    expect((await post(createMain, { _id: "3200/4", title: "Dual process", body: "Root note." })).status).toBe(201);
    expect((await post(createMain, {
      _id: "3200/4A",
      title: "System 1",
      body: "Fast, automatic.",
      links: ["3200/4"],
      citations: [{ bibId: "kahneman_2011", page: "85" }],
    })).status).toBe(201);
    expect((await post(createMain, { _id: "3200/4B", title: "System 2", body: "Slow, effortful." })).status).toBe(201);

    // --- Register an Index keyword pointing into the Main Box ---
    expect((await post(createIndex, {
      _id: "Cognitive Bias",
      displayTerm: "Cognitive Bias",
      entryPoints: ["3200/4A", "3200/4"],
    })).status).toBe(201);

    // --- Error paths ---
    expect((await post(createMain, { _id: "3200/4", title: "dup", body: "dup" })).status).toBe(409); // duplicate _id
    expect((await post(createMain, { _id: "3200/B", title: "bad", body: "bad" })).status).toBe(400); // invalid address
    expect((await getMainByAddress(["9999", "1"])).status).toBe(404); // missing

    // --- Traverse the Main Box: children + backlinks + box-flipping ---
    const mainRes = await getMainByAddress(["3200", "4"]);
    expect(mainRes.status).toBe(200);
    const main = await mainRes.json();
    expect(main.card._id).toBe("3200/4");
    expect(main.children.map((c: { _id: string }) => c._id).sort()).toEqual(["3200/4A", "3200/4B"]);
    expect(main.backlinks.map((c: { _id: string }) => c._id)).toContain("3200/4A"); // 4A links to 4
    expect(main.next?._id).toBe("3200/4A"); // box-flipping forward

    // --- Provenance: the Bib card knows who cites it ---
    const bibRes = await getById(getBib, "kahneman_2011");
    expect(bibRes.status).toBe(200);
    const bib = await bibRes.json();
    expect(bib.citedBy.map((c: { _id: string }) => c._id)).toContain("3200/4A");

    // --- Top-down: the Index keyword resolves its entry points to real Main cards ---
    const indexRes = await getById(getIndex, "cognitive bias");
    expect(indexRes.status).toBe(200);
    const index = await indexRes.json();
    expect(index.card._id).toBe("cognitive bias");
    const resolved = index.entries.find((e: { address: string }) => e.address === "3200/4A");
    expect(resolved?.card?.title).toBe("System 1");

    // --- Slice 4: A–Z browse ---
    expect((await (await getList(listBib, "letter=K")).json()).map((c: { _id: string }) => c._id)).toContain("kahneman_2011");
    expect((await (await getList(listIndex, "letter=C")).json()).map((c: { _id: string }) => c._id)).toContain("cognitive bias");

    // --- Slice 5: address suggester (3200/4, 3200/4A, 3200/4B exist) ---
    expect(await (await getList(suggestRoute, "anchor=3200/4")).json()).toMatchObject({ child: "3200/4C", sibling: "3200/5" });
    expect(await (await getList(suggestRoute, "anchor=3200/4A")).json()).toMatchObject({ child: "3200/4A1", sibling: "3200/4C" });
    expect((await (await getList(suggestRoute, "anchor=3200")).json()).sibling).toBeNull(); // section has no sibling

    // --- Slice 2: add a reading note, then promote it into a Main card ---
    const noteRes = await postTo(addNote, "kahneman_2011", { page: "99", note: "Anchoring heuristic" });
    expect(noteRes.status).toBe(201);
    expect((await noteRes.json()).readingNotes).toHaveLength(1);

    const promoteRes = await postTo(promoteNote, "kahneman_2011", {
      noteIndex: 0,
      main: { _id: "3200/7", title: "Anchoring", body: "Estimates cling to an initial value." },
    });
    expect(promoteRes.status).toBe(201);
    const promoted = await promoteRes.json();
    expect(promoted.main._id).toBe("3200/7");
    expect(promoted.bib.readingNotes[0].processedToMainId).toBe("3200/7"); // note marked

    // the promoted card cites the source, so it shows up in the Bib's provenance
    const bibAfter = await getById(getBib, "kahneman_2011");
    expect((await bibAfter.json()).citedBy.map((c: { _id: string }) => c._id)).toContain("3200/7");

    // re-promoting the same note -> 409; a bad index -> 404
    expect((await postTo(promoteNote, "kahneman_2011", { noteIndex: 0, main: { _id: "3200/8", title: "x", body: "y" } })).status).toBe(409);
    expect((await postTo(promoteNote, "kahneman_2011", { noteIndex: 9, main: { _id: "3200/9", title: "x", body: "y" } })).status).toBe(404);

    // --- Slice 3: deletion & referential integrity ---
    // The Bib is cited (3200/4A, 3200/7), so deleting it is blocked and names the citers.
    const blocked = await deleteById(deleteBibRoute, "kahneman_2011");
    expect(blocked.status).toBe(409);
    expect((await blocked.json()).citedBy).toEqual(expect.arrayContaining(["3200/4A", "3200/7"]));

    // An Index card whose ONLY entry point is 3200/4B (to prove the sole-entry cascade delete).
    expect((await post(createIndex, { _id: "solo", displayTerm: "Solo", entryPoints: ["3200/4B"] })).status).toBe(201);

    // Delete 3200/4 -> heals 3200/4A's link to it, and pulls it from "cognitive bias" (kept, still has 3200/4A).
    const del4 = await (async () => (await deleteMainByAddress(["3200", "4"])).json())();
    expect(del4.unlinkedFrom).toBe(1);
    expect(del4.entryPointRemovedFrom).toContain("cognitive bias");
    expect((await (await getMainByAddress(["3200", "4A"])).json()).card.links).not.toContain("3200/4");

    // Delete 3200/4B -> "solo" loses its only entry point and is deleted with it.
    expect((await (await deleteMainByAddress(["3200", "4B"])).json()).indexCardsDeleted).toContain("solo");
    expect((await getById(getIndex, "solo")).status).toBe(404);

    // Remove the citing cards, then the Bib delete succeeds; missing targets are 404.
    expect((await deleteMainByAddress(["3200", "4A"])).status).toBe(200);
    expect((await deleteMainByAddress(["3200", "7"])).status).toBe(200);
    expect((await deleteById(deleteBibRoute, "kahneman_2011")).status).toBe(200);
    expect((await deleteById(deleteIndexRoute, "nope")).status).toBe(404);
    expect((await deleteMainByAddress(["9999", "1"])).status).toBe(404);
  });
});
