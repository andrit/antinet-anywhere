# Slice 5 — Address suggester

**Status:** draft · 2026-11-24
**Goal:** finish the Create-Main friction-reducer deferred in slice 1 — one-click "next child / next
sibling" that skips addresses already taken. The `child`/`sibling`/`parent` math already exists in
`lib/antinet/address.ts`; this adds the "first *free* slot" search and surfaces it.

## Semantics

Given an anchor address A:

- **next child** = `child(A)` (its first child), stepped by `sibling` until a free address is found.
  `child(3200/4)` → `3200/4A`; if `3200/4A` exists → `3200/4B`, etc.
- **next sibling** = `sibling(A)` stepped until free. A **section header has no sibling** (sections
  are free-choice) → `null`.

The candidates for either are all **direct children of one parent** (the anchor for a child search;
`parent(A)` for a sibling search), so the repository fetches that one `childrenOf` set and the pure
search runs against it — no unbounded probing.

## Pieces

- `lib/antinet/suggest.ts` (pure, tested): `firstFree(start, step, taken)` — step until the address
  isn't taken.
- Repo (`main-card-repo.ts`, I/O): `suggestChildAddress`, `suggestSiblingAddress` — build the taken
  set from `childrenOf`, then `firstFree`.
- `GET /api/suggest?anchor=<address>` → `{ anchor, child, sibling }` (`sibling` null for a section).
  Query param (not a path) to avoid the "/" in addresses colliding with the catch-all route.
- UI: in the Create-Main form, when a Main card is open it's the anchor — "+ Child of A" / "+ Sibling
  of A" buttons fill the address field. (The existing children are already visible in the reader.)

## Out of scope

Suggesting Bib slugs or Index keywords; auto-filling title/body.
