# Antinet Address Grammar & Sort Key

**Status:** ratified · gated 2026-11-22
**Phase:** 0 (DDD / ubiquitous language) — this is the load-bearing artifact; the parser, sort
order, navigation, and the Create-Main-Card neighbor context all derive from it.
**Scope:** the Luhmann / Scott Scheper Antinet addressing system, as the project will simulate it.

---

## 1. Ubiquitous language (address terms)

| Term | Meaning |
|---|---|
| **Section** | The top-level subject number before the `/` (e.g. `3200`). A free-chosen, widely-spaced register number (thousand-blocks = domains, hundred-blocks = sub-disciplines). Gaps are intentional. |
| **Section header card** | A card whose address is a bare section with **no** `/` (e.g. `3200`). Sorts before all of that section's contents. |
| **Branch path** | Everything after the `/` — the infinite alternating sequence of number/letter tokens (e.g. `4B1A`). |
| **Token** | One segment of the branch path: a number run (`4`, `10`) or a letter run (`B`, `AA`). |
| **Level / depth** | How many tokens deep a card sits in its section. `3200/4` is level 1, `3200/4B` is level 2. |
| **Child** | A card one level deeper — appends the opposite token type. Child of `3200/4B` → `3200/4B1`. |
| **Sibling** | A card at the same level — increments the last token. Sibling of `3200/4B` → `3200/4C`. |
| **Parent** | The card one level shallower (drop the last token). Parent of `3200/4B` → `3200/4`. |

---

## 2. The grammar

```
address      := section ( "/" branchPath )?
section      := DIGIT+                      ; e.g. 3200  — exactly one, no letters
branchPath   := numberTok ( letterTok numberTok ... )?   ; strictly alternating, STARTS with a number
numberTok    := DIGIT+                       ; 1-based (no leading-zero semantics)
letterTok    := [A-Z]+                       ; spreadsheet-style: A..Z, AA, AB, ...
```

Rules that fall out of this:

1. **Exactly one `/`, or none.** A bare section (`3200`) is a section header card. Nesting never adds
   more slashes — the alternating token *types* are the delimiter, so no extra separators are
   needed for infinite depth.
2. **Strict alternation, starting with a number.** After the `/` the path alternates
   number → letter → number → letter → …:

   | Level | Type | Example |
   |---|---|---|
   | 1 | number | `3200/4` |
   | 2 | letter | `3200/4B` |
   | 3 | number | `3200/4B1` |
   | 4 | letter | `3200/4B1A` |
   | 5 | number | `3200/4B1A1` |

   Because the type switches every step, no dots or extra slashes are needed to see where one
   level ends and the next begins — the type change *is* the delimiter.
3. **Section is free-choice and widely spaced.** `1000, 2000, 3000` = broad domains; `3100, 3200,
   3500` = sub-disciplines; you may invent `3250` later between `3200` and `3300` without
   renumbering. Sections are **not** sequential and gaps are expected.

---

## 3. Operations (what the engine computes)

Off a card `A`:

- **child(A)** — append the next-type token starting at its first value:
  `child(3200/4B)` → `3200/4B1` · `child(3200/4)` → `3200/4A`
- **sibling(A)** — increment the last token in place:
  `sibling(3200/4B)` → `3200/4C` · `sibling(3200/4)` → `3200/5`
- **parent(A)** — drop the last token: `parent(3200/4B)` → `3200/4` ·
  `parent(3200/4)` → `3200` (the section header) · `parent(3200)` → ⊥ (none)

Incrementing a **letter** token is **spreadsheet-style** (bijective base-26): after `Z` comes
`AA`, then `AB … AZ, BA … ZZ, AAA …`. Incrementing a **number** token is ordinary +1.

> Note: the slice-1 Create-Main-Card modal does **not** auto-compute these (the suggester is a
> fast-follow). It only *shows the anchor card's existing children/neighbors* and rejects a
> duplicate address. The `sibling`/`child`/`parent` functions above are still needed now for
> navigation and sort, just not surfaced as one-click "next address" buttons yet.

---

## 4. Sort order — the requirement

Cards must render in exact physical box order. The ordering, by example within one section:

```
3200            (section header, sorts first)
3200/1
3200/4
3200/4A
3200/4A1
3200/4B
3200/4B1
3200/4B1A
3200/4C
3200/4Z
3200/4AA        ← spreadsheet rollover: AA sorts AFTER Z, not after A
3200/4AB
3200/5
3200/10         ← sorts after 5, not before 2
```

Two properties this must satisfy that naive string sorting gets wrong:

- **Numbers sort numerically:** `10` after `5` (not lexicographically before `2`).
- **Letters sort spreadsheet-style = length-first:** every single letter before every double
  letter (`…4Z` then `4AA`). This is why the proposal's `padEnd(4, '_')` is wrong — `_`
  (ASCII 95) sorts *above* letters, and fixed-width left-aligned padding can't produce
  length-first ordering with any pad char.

## 5. Sort key — the encoding

We store a derived `sortKey` string on each card and put a plain ascending index on it; MongoDB's
B-tree then reproduces physical order. The key is computed by a **pure function** of the address
(testable with no database).

**Algorithm:**

1. Split off the section (before `/`) and the branch path (after `/`).
2. Encode the section as a number token (below).
3. Tokenize the branch path into its alternating number/letter runs.
4. Encode each token and join **all** encoded tokens (section first) with `"."`.

**Per-token encoding:**

- **Number token** `n` → `"N" + zeroPad(n, 6)` → `4` → `N000004`, `10` → `N000010`.
- **Letter token** `s` → `"L" + zeroPad(base26(s), 6)` where `base26` is bijective
  (A=1, Z=26, AA=27, AB=28, AZ=52, BA=53, ZZ=702, AAA=703) → `B` → `L000002`,
  `Z` → `L000026`, `AA` → `L000027`.

The `"."` join (ASCII 46, below `L`=76 and `N`=78) guarantees a shorter token sequence that is a
prefix of a longer one sorts **first** — i.e. a parent always sorts immediately before its
children. Encoding letters by their base-26 *value* (not their text) makes `Z`(26) < `AA`(27)
automatically, giving the length-first spreadsheet order for free.

### Worked table (these rows become the parser's test fixtures)

| Address | sortKey |
|---|---|
| `3200` | `N003200` |
| `3200/1` | `N003200.N000001` |
| `3200/4` | `N003200.N000004` |
| `3200/4A` | `N003200.N000004.L000001` |
| `3200/4A1` | `N003200.N000004.L000001.N000001` |
| `3200/4B` | `N003200.N000004.L000002` |
| `3200/4B1` | `N003200.N000004.L000002.N000001` |
| `3200/4B1A` | `N003200.N000004.L000002.N000001.L000001` |
| `3200/4C` | `N003200.N000004.L000003` |
| `3200/4Z` | `N003200.N000004.L000026` |
| `3200/4AA` | `N003200.N000004.L000027` |
| `3200/4AB` | `N003200.N000004.L000028` |
| `3200/5` | `N003200.N000005` |
| `3200/10` | `N003200.N000010` |

Sorting these keys ascending reproduces §4 exactly, including `4Z` < `4AA` and `5` < `10`.

---

## 6. Validation rules (the parser rejects)

- Empty / whitespace-only input.
- A section that isn't `DIGIT+` (letters before the `/`, e.g. `A200`).
- More than one `/`; a trailing `/`; a `/` with an empty branch path.
- A branch path that doesn't start with a number, or breaks alternation (`3200/4CC` is a letter
  run `CC` = valid; `3200/44` is a number run = valid; what's invalid is two tokens of the same
  type *adjacent across a level* — but note the tokenizer reads maximal runs, so `3200/4B2C`
  parses as `4 B 2 C`, alternating and valid). Define "invalid alternation" precisely in tests.
- Normalization: addresses are upper-cased and trimmed before parsing/storage.

## 7. Documented ceilings (become `ponytail:` notes in code)

- Number tokens and letter-run base-26 values are zero-padded to **6 digits**, so each caps at
  **999,999** (letter runs ≈ up to 4 letters). Generous for a personal antinet; past that the
  sort key mis-orders **silently**. Upgrade path: widen the pad (cheap) and reindex. Mark at the
  code with `// ponytail:` and surface at phase audit.

## 8. Open question for the gate

- **Case in letter tokens:** addresses normalize to uppercase (§6). Confirmed consistent with
  storing `links`/`entryPoints` uppercase elsewhere.
- Anything in §6's "invalid alternation" you want stricter or looser than the maximal-run
  tokenizer implies? That's the one spot the grammar is still slightly fuzzy, and tests will
  pin it.
