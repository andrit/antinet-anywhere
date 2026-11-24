# Slice 2 — the Promote (Bib → Main) workflow

**Status:** draft · 2026-11-24
**Goal:** the core antinet reading loop — capture rough reading notes on a Bib card, then *promote* a
note into a permanent atomic Main card that cites the source. Builds on slice 1; terms from
[`ubiquitous-language.md`](./ubiquitous-language.md), schema from [`bounded-contexts.md`](./bounded-contexts.md).

## What's new

1. **Add a reading note** to an existing Bib card (`page` + `note`). The schema already carries
   `readingNotes` and `processedToMainId`; slice 1 just never wrote to them after creation.
2. **Promote a reading note** → create a Main card that cites `{ bibId, page }`, and mark the note's
   `processedToMainId` with the new address.

## Decisions

- **Note identity = array index.** Reading notes have no stable id; the caller targets a note by its
  position in `readingNotes`. Rationale: no schema change, single-user scale. *Ceiling:* concurrent
  edits could shift indices. *Upgrade:* give each note an id generated on add. (`ponytail:` in code.)
- **Promote is cross-aggregate and non-atomic.** It writes two aggregates — insert the Main card,
  then `$set` the note's `processedToMainId`. Order is insert-first so a failure leaves a real card
  with an unmarked note (recoverable), never a marked note pointing at nothing. Consistent with the
  slice-1 stance that referential integrity is deferred. No transaction.
- **The citation comes from the note, not the client.** Promote prepends `{ bibId: <slug>,
  page: <note.page> }` to the new Main card's citations; the reader supplies address/title/body/links.
- **A note already promoted cannot be re-promoted** (409).

## Surface

- `POST /api/bib/{slug}/notes` — body `{ page, note }` → appends a reading note; returns the Bib card.
- `POST /api/bib/{slug}/promote` — body `{ noteIndex, main: { _id, title, body, links? } }` →
  returns `{ main, bib }`. Statuses: 201; 400 invalid; 404 bib/note missing; 409 dup address or
  already-promoted.

## Pure core (`lib/antinet/promote.ts`, tested)

- `AddReadingNoteSchema` = `ReadingNoteSchema.pick({ page, note })` (single source, no duplication).
- `PromoteSchema` = `{ noteIndex, main: MainCardInputSchema.omit({ citations }) }`.
- `selectPromotableNote(bib, index)` — the note, or throws `HttpError` 404 / 409.
- `buildPromotedMainInput(bibId, page, main)` — merges the source citation in.

A reusable `HttpError(status, message)` is added to `api-errors.ts` so domain errors map to real
status codes (not a blanket 500).

## Out of scope (still later)

Editing/removing a reading note; stable note ids; the suggester; A–Z; referential integrity.
