# 001 — Make the CHANGELOG opt-in explicit in the fullstack (base) template

**Status:** open

## Problem

The template guarantees Conventional-Commit git history, but a human-readable `CHANGELOG.md` is only
referenced *conditionally* — two skills say "if the project keeps one" / "if your project has one"
(`_base/skills/phase-checkpoint/SKILL.md`, `_base/skills/promote-to-production/SKILL.md`). Nothing
tells a new project to *decide* whether to keep one, and nothing scaffolds it. The result is that the
decision is never surfaced, so projects silently end up without a changelog even when they'd want one.

## Origin

antinet-pwa (Mode B), 2026-11-24. The developer expected the template to already instruct keeping a
git/commit log for every project; investigation showed it's changelog-*aware* but not enforced or
prompted. Agreed fix: make the opt-in **explicit and early**, not mandatory (a CHANGELOG is overhead
for throwaway/internal tools, valuable for anything with users or releases).

## Proposed change

In `_base/scaffold/CLAUDE.md`, add a new principle bullet immediately **after** the
"SemVer and Conventional Commits" bullet:

```markdown
**Changelog — decide at scaffold time.** The Conventional-Commit git history is always the
per-commit record. On top of that, decide early whether this project keeps a human-readable
`CHANGELOG.md` ([Keep a Changelog](https://keepachangelog.com) form): worth it for anything with
users or releases, skippable for a throwaway or internal tool. If yes, create it in Phase 1 and add
a `## [Unreleased]` entry in the same change that makes a notable change — the `phase-checkpoint` and
`promote-to-production` skills already maintain it *if the project has one*. Record the decision here.
```

## What NOT to do

- Do **not** make a CHANGELOG mandatory, and do **not** auto-scaffold a `CHANGELOG.md` stub into every
  project — the point is an explicit decision, not a forced artifact.
- Do **not** change the two conditional skill hooks; "if the project has one" is the correct behavior
  and already works once a project opts in.

## Acceptance criteria

- A newly scaffolded fullstack project's `CLAUDE.md` contains the bullet above.
- No `CHANGELOG.md` is created unless the project opts in.
- The phase-checkpoint / promote-to-production skills remain unchanged and still maintain a
  `CHANGELOG.md` when one exists.
