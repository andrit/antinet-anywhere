# Slice 3 — Deletion & referential integrity

**Status:** draft · 2026-11-24
**Goal:** remove the slice-1 caveat that references may dangle. Add **delete** for all three boxes,
with guardrails so a delete never leaves a broken circuit. (Re-addressing stays deferred — see the
identity note in [`bounded-contexts.md`](./bounded-contexts.md).)

## Rules

- **Delete a Bib card** → **blocked (409)** if any Main card still cites it; the response lists the
  citing addresses so the user can fix them first. (We block rather than cascade: a source's notes
  are too valuable to delete implicitly.)
- **Delete a Main card** → allowed, with a **cascade clean-up**:
  - pull its address from every other Main card's `links` (backlinks heal),
  - pull its address from every Index card's `entryPoints`,
  - **delete any Index card left with zero entry points** — a keyword with no way into the Main Box
    can't satisfy its own 1–4 invariant and is meaningless. The response reports what changed.
- **Delete an Index card** → always allowed (nothing references an Index card).

## Why mostly I/O, and how it's tested

Integrity is inherently about cross-collection MongoDB behavior (`$pull`, `updateMany`, size-0
sweep), so the logic lives in the repositories (the shell) and is verified by the **live smoke test**,
not by mocking. The one genuinely pure decision — splitting the Index cards that reference a deleted
address into *delete* (it was their only entry point) vs *pull* — is `partitionIndexRefs` in
`lib/antinet/integrity.ts`, unit-tested.

## Surface

- `DELETE /api/main/{address}` → `{ deleted, unlinkedFrom, entryPointRemovedFrom, indexCardsDeleted }`
- `DELETE /api/bib/{slug}` → `{ deleted }`, or `409 { error, citedBy }`
- `DELETE /api/index/{keyword}` → `{ deleted }`
- All: `404` if the card doesn't exist.

## Out of scope

Re-addressing (rename), editing card contents, undo. Reading-note deletion.
