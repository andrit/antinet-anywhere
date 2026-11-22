# Ubiquitous Language

**Status:** ratified · gated 2026-11-22
**Phase:** 0 (DDD). The shared vocabulary — code, docs, UI, and conversation must all use these
exact words for these exact things. If the word changes, the concept changed.

> The **Addressing** section below carries one-line glosses of the address terms for quick
> reference. Their full definitions, rules, and the sort-key encoding live once in
> [`antinet-address-grammar.md`](./antinet-address-grammar.md) — the single source for the detail.

## The system

- **Antinet** — the whole simulated system: three boxes forming one closed retrieval circuit. Not
  a folder tree and not a tag cloud; navigation is by address, citation, link, and keyword.
- **Box** — one of the three top-level divisions. Exactly three: the **Main Box**, the **Bib
  Box**, the **Index Box**. Each is one MongoDB collection.
- **Closed circuit** — the defining property: you *read* (Bib) → *extract an atomic idea* (Main,
  addressed, citing the source) → *register a way back in* (Index keyword → entry point) →
  *retrieve* by walking Index → Main → flipping/following links. Drop any box and the circuit
  breaks (Main without Index = unnavigable pile; Main without Bib = non-atomic cards).

## The cards

- **Card** — one document; one unit. Never a folder.
- **Main card** — a permanent note in the Main Box: **one atomic idea in your own words**, at a
  branched **address**. The heart of the antinet. (`main_cards`)
- **Bib card** (source card) — one source in the Bib Box: a book/article/etc., its metadata, and
  the raw **reading notes** taken from it. Keyed by an author-year **slug**. (`bib_cards`)
- **Index card** (keyword card) — one keyword in the Index Box, pointing to a small set of
  **entry points** into the Main Box. Keyed by the normalized **keyword**. (`index_cards`)
- **Slug** — the human-readable unique key of a Bib card: `lastname_year`, with a letter appended
  on collision (`kahneman_2011`, then `kahneman_2011a`, `kahneman_2011b` for a second/third source
  by the same author in the same year). The citation shorthand reads off it.

## Addressing (Main cards)

> Glosses only — see [`antinet-address-grammar.md`](./antinet-address-grammar.md) for the grammar,
> operations, and sort-key encoding in full.

- **Address** — the unique identifier of a Main card (`3200/4B1`), expressing its exact place in
  the box. Immutable in slice 1 (re-addressing is deferred). Composed of a **Section** and an
  optional **Branch path** separated by `/`.
- **Section** — the free-choice top-level integer before the `/` (e.g. `1000`, `3200`): a broad
  subject register, Dewey-style, widely spaced, gaps intentional. A Main card whose address is a
  bare section with no `/` is a **section header card**.
- **Branch path** — the strictly alternating number → letter → number sequence after the `/`
  (`4B1`), encoding parent/child/sibling depth within a section.
- **Child / Sibling / Parent** — relative positions in the branch path: a *child* appends the
  next-type token (`3200/4B` → `3200/4B1`), a *sibling* increments the last token (`→ 3200/4C`), a
  *parent* drops it (`→ 3200/4`). Letters roll over spreadsheet-style (`…Z` → `AA`).
- **Sort key** — the normalized, zero-padded encoding of an address stored on each Main card so a
  plain database index reproduces physical box order — e.g. `3200/4B1` →
  `N003200.N000004.L000002.N000001`. An explicit term so no one confuses sorting by the raw address
  *string* with sorting by `sortKey`: the raw string mis-orders `10` before `2` and `AA` before `Z`.
- **Anchor** — the existing Main card you are branching off or continuing from when placing a new
  card (the card the **neighbor context** is shown for).

## The relationships (the edges of the circuit)

- **Atomic** — one idea per Main card. The analog constraint: a Main card body is capped (≈600
  chars, a 4×6 index card). Overflow is a signal to split into a branched child, not to write more.
- **Link** — a manual cross-reference from one Main card to another, by address. Directional.
- **Backlink** — the reverse view of a link: "which Main cards link *to* this one." Derived by
  query, never stored.
- **Citation** — a provenance pointer from a Main card to a Bib card (by slug) with an optional
  page. Rendered as a clickable shorthand (e.g. *Kahneman 2011, p. 85*).
- **Provenance** — the two-way citation view: a Main card shows what it cites; a Bib card shows
  every Main card that cites it ("everything I extracted from this book").
- **Reading note** — a rough, fleeting note (page + text) captured on a Bib card *while reading*,
  before it's been distilled. Lives in the Bib Box so Main cards stay atomic.
- **Entry point** — one Main-card address listed on an Index card. **1–4 per keyword** — the hard
  antinet discipline that keeps the Index Box from becoming a tag cloud.

## The workflows

- **Promote** (extract) — turn a reading note into a Main card: distil the idea, give it an
  address, carry the citation across, mark the reading note done. The core reading loop.
  *(fast-follow; slice 1 creates the citing Main card by hand.)*
- **Box-flipping** — browsing adjacent cards in **sort-key order** (previous / next neighbor),
  the way you'd thumb through a physical box.
- **Neighbor context** — when creating a Main card under an anchor, showing that anchor's
  existing children/siblings so you can pick a free address by eye (slice-1 stand-in for the
  address **suggester**, which is a fast-follow).

## Deferred (named now so we use the words consistently later)

- **Re-addressing** — changing a card's address after creation. Deferred; see the identity note
  in [`bounded-contexts.md`](./bounded-contexts.md).
- **Referential integrity** — blocking/repairing dangling links, citations, and entry points on
  delete or re-address. Deferred to a later slice.
- **Escape-hatch search** — full-text search over card text, for when you've forgotten the
  keyword. Deferred.
