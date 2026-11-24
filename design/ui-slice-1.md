# UI — Slice 1 (the circuit)

**Status:** draft · 2026-11-24
**Phase:** D (Design) — kept deliberately light, matching the "simplest real antinet" aim. Terms from
[`ubiquitous-language.md`](./ubiquitous-language.md); it drives the three API route groups already built.

## User flows (the closed circuit)

1. **Capture a source** → create a Bib card.
2. **Extract an idea** → create a Main card at an address, citing the Bib card and linking to neighbors.
3. **Register a way back in** → create an Index card (keyword → 1–4 entry points).
4. **Retrieve** → open an Index keyword and jump to a Main entry point; flip/follow its links,
   children, and citations; or open a Bib source and see every Main card that cites it.

Every card address shown anywhere is clickable and opens that Main card in the reader — that click-through *is* the circuit.

## Page inventory

- **One page, `/`** — the whole slice-1 circuit. No routing beyond `/`, no auth (both later phases).
  Three panels (Main, Bib, Index); each does **create** + **view** for its box, and views cross-link
  into the Main reader. Deep-linking to a specific card by URL is a deferred nicety.

## Component hierarchy

- `AntinetApp` (client; holds the open-card state + a single error banner)
  - `MainForm` · `BibForm` · `IndexForm` — the three create forms
  - `MainView` (card + prev/next box-flip + children + links + backlinks + citations)
  - `BibView` (source + who-cites) · `IndexView` (keyword + entry points resolved to Main cards)
  - atoms: `Field`, `TextField`, `Button`, `Banner`, `CardLink`
- `lib/antinet/api-client.ts` — typed `fetch` wrappers over the routes (`createCard`, `getMain`, `getBib`, `getIndex`).

## Design tokens (semantic roles — one role per token, stable across themes)

Defined in `app/globals.css`: `--bg`, `--surface`, `--surface-2`, `--text`, `--text-muted`,
`--border`, `--accent`, `--accent-text`, `--danger`, `--ok`; a `--space-1..5` scale; `--radius`;
`--font`, `--mono`. A light palette now; a `prefers-color-scheme: dark` block redefines the same
roles, so no component hard-codes a color.

## Mobile plan

- Panels are a responsive grid: three columns on wide screens, a single stacked column on narrow.
- Reader controls (prev/next, links) wrap; tap targets ≥ 44px; body never scrolls horizontally
  (wide content scrolls within its own container). Relative units throughout.
