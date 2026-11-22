# Domain Events

**Status:** ratified · gated 2026-11-22
**Phase:** 0 (DDD). The domain's verbs — the significant things that *happen* to the three
aggregates. Terms from [`ubiquitous-language.md`](./ubiquitous-language.md).

## What this is, and what it is NOT

These events are a **modeling lens and a forward integration seam** — they are the business-
meaningful state changes, named in past tense. They are **not** a commitment to event sourcing:
the store of record stays the document (state-based) model in
[`bounded-contexts.md`](./bounded-contexts.md). Whether we ever *persist/emit* these events is a
later decision; the natural mechanism when we do (Phase 2) is **MongoDB change streams** feeding
the Neo4j graph, not an event store in front of writes.

Three reasons to name them now, before any of that:
1. They are the ubiquitous-language verbs — the operations the service layer and API expose.
2. They are exactly the **edges** the Phase-2 graph consumes (see the mapping below).
3. They align with the workbench's SDLC event log.

## MainCard events

| Event | Payload | Notes |
|---|---|---|
| `MainCardCreated` | `address, sortKey, section, citations[], links[]` | the atomic idea is filed |
| `MainCardReworded` | `address, title?, body?` | content edited (stays atomic) |
| `MainCardLinked` | `fromAddress, toAddress` | a cross-reference added |
| `MainCardUnlinked` | `fromAddress, toAddress` | cross-reference removed |
| `MainCardCited` | `address, bibId, page?` | provenance pointer to a Bib card added |

## BibCard events

| Event | Payload | Notes |
|---|---|---|
| `BibCardCreated` | `bibId, authorSort, title, year?, sourceType` | a source enters the Bib Box |
| `ReadingNoteAdded` | `bibId, page, note` | fleeting note captured while reading |
| `ReadingNotePromoted` | `bibId, page, mainAddress` | promote → Main (fast-follow workflow) |

## IndexCard events

| Event | Payload | Notes |
|---|---|---|
| `IndexCardCreated` | `keyword, displayTerm, entryPoints[]` | a keyword enters the Index Box |
| `EntryPointAdded` | `keyword, mainAddress` | subject to the 1–4 cap |
| `EntryPointRemoved` | `keyword, mainAddress` | |

## Deferred-slice events (named so the vocabulary is stable)

These belong to the deferred **referential-integrity** and **re-addressing** work; they drive the
guardrails, so they're listed but not built in slice 1.

| Event | Why it's deferred |
|---|---|
| `MainCardDeleted` | triggers pulling the address from inbound links & entry points |
| `MainCardReaddressed` | re-addressing is deferred (identity note in `bounded-contexts.md`) |
| `BibCardDeleted` | blocked/repaired if any Main card still cites it |

## Event → Phase-2 graph mapping (why capturing them pays off later)

When Neo4j arrives, these events are the upserts — no re-derivation needed, the edges are already
named:

- `MainCardCreated` → `(:Main {address})` node
- `MainCardLinked` → `(:Main)-[:LINKS_TO]->(:Main)`
- `MainCardCited` → `(:Main)-[:CITES]->(:Bib)`
- `EntryPointAdded` → `(:Index)-[:ENTRY_POINT]->(:Main)`
- `BibCardCreated` → `(:Bib {bibId})` node

This is why the embedded arrays in the document model (`links`, `citations`, `entryPoints`) are
"already the edges a graph needs" — each corresponds to one event above.
