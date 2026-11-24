# Slice 4 — A–Z browsing

**Status:** draft · 2026-11-24
**Goal:** divider-bar navigation for the Bib and Index boxes — pick a letter, see the cards whose
author (Bib, by `authorSort`) or keyword (Index, by `_id`) starts with it. The smallest slice; pure
navigation, no new data.

## Decisions

- **Prefix match, case-insensitive, anchored.** A letter `K` matches `authorSort` / keyword starting
  with `K`/`k`. The one real concern is **regex injection** (the letter reaches a `RegExp`), so the
  prefix is built through a pure, tested `escapeRegExp` + `prefixMatcher`.
- **Return full cards, not summaries.** Simpler (reuses the existing `BibCard` / `IndexCard` schemas
  in the contract) and fine at personal scale. *ponytail:* payload includes reading notes; a
  projected summary is the upgrade if a box grows large.
- **`letter` is optional** — absent means "all", so the UI can also list everything.

## Surface

- `GET /api/bib?letter=K` → `BibCard[]`, sorted by `authorSort`.
- `GET /api/index?letter=C` → `IndexCard[]`, sorted by keyword.

(These are new `GET`s on the existing collection routes, which previously had only `POST`.)

## Pieces

- `lib/antinet/browse.ts` (pure, tested): `escapeRegExp`, `prefixMatcher`.
- Repo: `bibCardsByLetter`, `indexCardsByLetter`.
- UI: a reusable `AzBrowser` (A–Z bar + results list) in the Bib and Index panels; results click
  through to the card.

Indexes `authorSort` (Bib) and `_id` (Index, automatic) back these queries (see §4 of the user guide).
