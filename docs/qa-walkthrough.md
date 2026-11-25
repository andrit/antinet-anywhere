# QA Walkthrough — the full circuit

A scripted, click-by-click pass through every feature, with the expected result at each step. This is
the roadmap's **Phase 8 QA gate** — the human-verified full-feature test. Run it against the live site
(`https://antinet-anywhere.vercel.app`) or locally (`npm run dev` → `http://localhost:3000`).

**Before you start**
- This **writes real data** to whatever database `DATABASE_URL`/`DB_NAME` point at. Fine on your own
  cluster — the last section deletes most of it, and you can always drop the collections in Atlas.
- Confirm the stack is up: open `/api/health` → `{"status":"ok", ...}`. If it's `degraded`, fix the
  env/connection first (see `user-guide.md` §10) before walking through.
- The page is one screen with three panels: **Main Box**, **Bib Box**, **Index Box**. Errors appear as
  a red banner at the top. Addresses shown anywhere are clickable and open in the Main reader.

---

## 1. Capture a source (Bib Box)

**Do:** In the **Bib Box** panel fill — Slug `kahneman_2011`, Author sort `Kahneman, Daniel`, Title
`Thinking, Fast and Slow`, Year `2011`, Source type `book` — and click **Create Bib card**.

**Expect:** The Bib card opens below the form: title, a muted line `Kahneman, Daniel · 2011 · book`,
`No Main cards cite this yet.`, a **Reading notes** section with `No reading notes yet.` and an
add-note form, and a **Delete** button.

## 2. Add a reading note

**Do:** In the opened Bib card's Reading-notes area, enter Note page `85`, Note text
`System 1 jumps to conclusions`, click **Add note**.

**Expect:** The note appears as `p.85  System 1 jumps to conclusions` with a **Promote** button next to
it; the "No reading notes yet" line is gone.

## 3. Create a root Main card

**Do:** In the **Main Box** panel: Address `3200/4`, Title `Dual process`, Body `Two systems of
thinking.`, click **Create Main card**.

**Expect:** The Main reader shows `3200/4`, the title and body. (No children/links/backlinks yet.)

## 4. Use the address suggester

**Do:** With `3200/4` open, look at the top of the Main create form — you should now see **+ Child of
3200/4** and **+ Sibling of 3200/4** buttons. Click **+ Child of 3200/4**.

**Expect:** The Address field fills with `3200/4A`. (If it had existed, the suggester would skip to the
next free one, e.g. `3200/4B`.)

## 5. Create a child that cites the source and links up

**Do:** With `3200/4A` prefilled, add — Title `System 1`, Body `Fast, automatic.`, Links `3200/4`,
Cite bibId `kahneman_2011`, Cite page `85` — and **Create Main card**.

**Expect:** `3200/4A` opens showing a **Links** chip `3200/4`, a **Citations** chip `kahneman_2011,
p.85`, and a **← / →** box-flip row.

## 6. Walk the circuit

**Do / Expect:**
- On `3200/4A`, click the citation chip **kahneman_2011** → the Bib card opens and **Cited by** now
  lists `3200/4A`.
- In the Main Box, use **Open address** → `3200/4`. The reader shows **Children** = `3200/4A`,
  **Backlinks** = `3200/4A` (because 4A links to 4), and **→** next = `3200/4A`.

## 7. Promote a reading note (Bib → Main)

**Do:** Open the Bib card (`Open slug` → `kahneman_2011`). Next to the `p.85` reading note click
**Promote**. In the promote form: New address `3200/5`, Title `Anchoring`, Atomic idea
`Estimates cling to an initial value.`, click **Create Main card from note**.

**Expect:** The new Main card `3200/5` opens with a **Citations** chip `kahneman_2011, p.85` already
attached (carried from the note). Re-open the Bib card: the `p.85` note now shows a link to `3200/5`
instead of a Promote button, and **Cited by** lists both `3200/4A` and `3200/5`.

## 8. Register a keyword (Index Box)

**Do:** In the **Index Box** panel: Keyword `cognitive bias`, Display term `Cognitive Bias`, Entry
points `3200/4A, 3200/4`, click **Create Index card**.

**Expect:** The Index card opens; **Entry points** show `3200/4A — System 1` and `3200/4 — Dual
process`, both clickable (clicking opens that Main card).

## 9. A–Z browsing

**Do / Expect:**
- Bib Box → **Browse A–Z** → click **K** → the list shows `Kahneman, Daniel — Thinking, Fast and
  Slow`; clicking it opens the Bib card.
- Index Box → **Browse A–Z** → click **C** → `Cognitive Bias`; clicking it opens the Index card.

## 10. Validation guardrails (should be refused)

**Do / Expect** (each should show a red error banner, nothing created):
- Main Box: Address `3200/zzz` (letters where a number belongs) → **400**, "not a valid address".
- Main Box: Address `3200/4` again (duplicate) → **409**, already exists.
- Main Box: a Body longer than 600 characters → **400**, body cap message.
- Index Box: Entry points with five addresses → **400**, "at most 4 entry points".

## 11. Referential integrity (deletes)

**11a — a cited source can't be deleted.**
**Do:** Open the Bib card `kahneman_2011` → **Delete** → confirm.
**Expect:** A red banner: *Cannot delete: Main cards still cite this source* (it's cited by `3200/4A`
and `3200/5`). The card is **not** deleted.

**11b — deleting a Main card heals references.**
**Do:** Open `3200/4` → **Delete** → confirm.
**Expect:** `3200/4` is gone. Now open `3200/4A` → its **Links** no longer include `3200/4` (healed).
Open the Index card `cognitive bias` → its entry points are now just `3200/4A` (the `3200/4` entry was
pulled, the card survived).

**11c — a sole entry point cascades.**
**Do:** Create Main `3200/9` (any title/body). Create an Index card: Keyword `solo`, Display term
`Solo`, Entry points `3200/9`. Then open `3200/9` → **Delete** → confirm.
**Expect:** `3200/9` is gone, and the `solo` keyword is **auto-deleted** too (it had no other entry
point). Confirm with **Open keyword** → `solo` → a red "not found" banner.

## 12. Confirm persistence in Atlas (optional)

**Do:** In the Atlas data explorer open the `antinet` database.
**Expect:** Collections `main_cards`, `bib_cards`, `index_cards` exist with the documents you created
(the deleted ones absent). A Main card document carries a derived `sortKey` and embedded `citations`.

## 13. Clean up (optional)

Delete the remaining cards from the UI, or in `mongosh` /the Atlas explorer:
`db.main_cards.drop(); db.bib_cards.drop(); db.index_cards.drop()`.

---

## Run log

Record each pass so regressions are visible across runs.

| Date | Where (local / prod) | Result | Notes / anything that failed |
|---|---|---|---|
| 2026-11-__ | prod | ☐ pass / ☐ fail | |

**Known non-bugs** (don't flag these): creating a Main card with a `link` or an Index `entry point`
that points at an address which doesn't exist yet is **allowed** by design (forward references) — the
Index view shows such entries as `(missing)`; a **section header has no sibling** so the suggester's
"+ Sibling" will show an error banner for a bare section like `3200`.
