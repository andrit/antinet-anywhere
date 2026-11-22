# Bounded Contexts & Aggregates

**Status:** ratified · gated 2026-11-22
**Phase:** 0 (DDD). Defines the consistency boundaries the code and the document model are built
around. Terms are from [`ubiquitous-language.md`](./ubiquitous-language.md).

## One bounded context: the Antinet

This is a single-domain app: one knowledge-box system, one model, one consistency language. There
is **one bounded context — the Antinet** — not twelve. Introducing more contexts now would be
ceremony without payoff. The one place a *second* context will eventually appear is the **Graph**
(Phase 2, Neo4j) — a downstream, read-only *analytical* context fed by this one's domain events. It
is explicitly out of scope until the core circuit is solid.

## Three aggregates

An **aggregate** is a consistency boundary: one root, mutated as a whole, and — here — persisted as
**one MongoDB document**. One write touches one aggregate, so a single document write is atomic and
we never need multi-document transactions for an invariant.

The three aggregate roots map one-to-one to the three boxes:

### 1. MainCard  →  `main_cards`  (root id: the **address**)

| Field | Notes |
|---|---|
| `_id` | the address, e.g. `3200/4B1` (uppercased, validated) |
| `sortKey` | **derived** from `_id` — never hand-set; indexed ascending for box-flipping |
| `title` | brief header (≤120) |
| `body` | the atomic idea (≤600 — the 4×6 analog cap) |
| `links` | `string[]` of other MainCard addresses — **references**, directional |
| `citations` | `CitationRef[]` `{ bibId, page? }` — **embedded** value objects |
| `createdAt` / `updatedAt` | timestamps |

**Invariants (enforced in the pure domain core, then persisted):**
- `_id` is a valid antinet address (grammar doc); `sortKey` is always `generateSortKey(_id)`.
- `body.length ≤ 600`, `title.length ≤ 120`.
- `links` and `citations[].bibId` point *outward* to other aggregates by identity — they are not
  guaranteed to resolve (integrity is deferred), which is a deliberate consequence of the
  aggregate boundary, not an oversight.

### 2. BibCard  →  `bib_cards`  (root id: the **slug**)

| Field | Notes |
|---|---|
| `_id` | author-year slug `lastname_year`, lowercased; +letter on collision (`kahneman_2011`, `kahneman_2011a`) — convention in `ubiquitous-language.md` |
| `authorSort` | `"Kahneman, Daniel"` — indexed for A–Z browsing (fast-follow) |
| `title`, `year`, `sourceType`, `publicationDetails?` | metadata (`year` optional — some sources have none) |
| `readingNotes` | `ReadingNote[]` `{ page, note, processedToMainId? }` — **embedded** |
| `createdAt` | created-only timestamp |

**Invariants:** slug id; reading notes are embedded because they're fleeting and meaningful only
as part of *this* source. `processedToMainId` is an outward reference (optional, may dangle).

### 3. IndexCard  →  `index_cards`  (root id: the normalized **keyword**)

| Field | Notes |
|---|---|
| `_id` | normalized lowercase keyword, e.g. `cognitive bias` |
| `displayTerm` | `"Cognitive Bias"` (presentation form) |
| `entryPoints` | `[string, ...string[]]` of MainCard addresses — **references** |
| `updatedAt` | updated-only timestamp |

**Invariants:** `1 ≤ entryPoints.length ≤ 4` (the discipline cap); entry points are de-duplicated
and uppercased. These run as **pure functions** over the array, then persisted — not as ORM hooks.

## Embed vs. reference — the rule we're applying

- **Embed** what the aggregate *owns* and that is meaningless outside it: `citations` on a Main
  card, `readingNotes` on a Bib card. They travel and version with their parent; one write.
- **Reference** (by identity — address / slug / keyword) across aggregate boundaries: `links`,
  `citations[].bibId`, `entryPoints`, `processedToMainId`. Crossing a boundary = an id, not a copy.

This is the mongo-swap design note realized: *keep an aggregate's invariants inside one document so
a single write stays atomic.*

## Identity decisions (and one deferred consequence)

- Each root uses its **natural key** as `_id` (address / slug / keyword) — it reads like the
  physical system and makes cross-references human-legible.
- **Cost, named deliberately:** address-as-`_id` makes **re-addressing** a delete+recreate that
  breaks every inbound `link`, `citation`, and `entryPoint`. We are **deferring re-addressing**
  for the MVP (decided with the developer). If it later becomes first-class, the migration is an
  immutable `ObjectId` `_id` + a unique-indexed `address` — a known, contained change. Flagged so
  it's a conscious choice, not inherited debt.

## Indexes (created in code at startup — no migrations, this is Mongo)

- `main_cards`: ascending `sortKey` (box-flipping); `text` on `title`+`body` (escape-hatch search,
  deferred feature but the index is cheap to declare).
- `bib_cards`: `authorSort` (A–Z browsing).
- `index_cards`: `_id` already indexed (keyword lookups + A–Z).
