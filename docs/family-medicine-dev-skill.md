---
name: family-medicine-dev
description: Mishpacha Mega (Family Medicine Shlav A) repo-specific dev guide. Triggers on Vite + ES module work in `C:/Users/User/repos/FamilyMedicine/`, version-trinity bumps (APP_VERSION / sw.js CACHE / package.json), AFP/הר"י index changes (`data/afp_hari_index.json`), Goroll/Nelson library refactors, and any IMA past-exam ingestion / fork-bug verification. Subordinate to the `audit-fix-deploy` skill — read this AFTER STEP 0 detects the FamilyMedicine repo.
---

# Family Medicine (Mishpacha Mega) — repo-specific dev guide

This is the in-repo subordinate of `audit-fix-deploy`. The parent skill detects the
target repo. This file holds Mishpacha-Mega-specific facts that the cross-repo
skill cannot fairly carry.

> NOTE — install path: this file is shipped at `docs/family-medicine-dev-skill.md`
> because user-global (`~/.claude/skills/`) and in-repo (`.claude/skills/`)
> were both blocked by the agent permission layer in R1+R2. To activate as a
> Claude skill, copy the file to `~/.claude/skills/family-medicine-dev/SKILL.md`
> manually (one shot, requires user permission).

## What this app is
Israeli family medicine board exam (`שלב א׳ רפואת המשפחה`). Sibling PWA to:
- `Geriatrics` (single-file PWA `shlav-a-mega.html`, no build)
- `InternalMedicine` (Vite + ES modules, `pnimit-mega.html`)

Shares: `shared/fsrs.js`, Supabase project `krmlzwwelqvlfslwltol`, Toranot
Netlify AI proxy.

## Live URL
`https://eiasash.github.io/FamilyMedicine/` (GitHub Pages, ~60–90 s after push)

## Version trinity
Three files MUST agree (CI gate enforces):
- `src/core/constants.js` → `APP_VERSION`
- `package.json` → `version`
- `sw.js` → `CACHE` key (must be `mishpacha-v<APP_VERSION>`)

Use `node scripts/sync-sw-version.cjs` to verify (it errors on drift, does not auto-fix).

## Q corpus structure
- 1061 Qs total: 950 across 7 IMA exam sessions + 111 `FM-Core` curated textbook Qs
- 7 sessions: `2020` (150) + `2021-Jun` (150) + `2022-Jun` (150) + `2023-Jun` (150) + `2024-May` (100) + `2024-Sep` (100) + `2025-Jun` (150)
- 27 topics (`ti` 0..26), `IMA_WEIGHTS` and `EXAM_FREQ` calibrated from the
  true 950-Q Family Medicine corpus (post v1.3.0 fork-bug remediation)
- Topic 9 (Rheumatology & MSK) is the largest single bucket at 100 Qs
- Topic 24 (the largest in EXAM_FREQ) holds 115 Qs in the live corpus

## Critical history — "fork-bug" (v1.3.0)
Prior to v1.3.0, 5 of the 7 exam sessions were accidentally ingested from
**Internal Medicine** PDFs because the repo was forked from Pnimit. ~593 of
the 943 Qs were IM content. v1.3.0 re-ingested all 5 from correct FM PDFs
(Sonnet-4.5 image OCR + IMA post-appeal answer keys, ~$11, ~30 min).

**Always verify** when forking from a sibling: PDF source must read
`רפואת המשפחה` not `רפואה פנימית`.

## Critical history — Vite base path (v1.2.10)
`vite.config.js` must have `base: '/FamilyMedicine/'`. v1.2.10 deploy stalled
because `base` was `/InternalMedicine/` (copy-paste from Pnimit fork). All
hashed assets 404'd. Guard test: `tests/deployConfigGuard.test.js`.

## Library tabs (5 sources)
1. **Goroll 8e** — primary FM source, 239 ch, local PDF, 1-tap deep-link to chapter page
2. **Nelson 22e** — pediatrics, 165 ch, Drive PDF, progressive-upgrade schema (ch row → `{file}` ⇒ local | `{page}` ⇒ Drive `#page=N` | else Drive root)
3. **Harrison 22e** — cross-reference only, NOT a primary FM source. 42 ch with in-app reader
4. **AFP/הר"י** — 542 papers across 23 specialties; rolling 7-year window (2018-2025); `data/afp_hari_index.json`
5. **Lerner 2025** — Hebrew prose, 329 sections (added v1.4.3)

## AFP/הר"י index format
```json
{ "version": 1,
  "window": "2018-06 → 2025-05",
  "exam": "Shlav A 2026",
  "totals": { "afp": 473, "hari": 69 },
  "specialties": [ ... 23 strings ... ],
  "papers": [
    { "title": "...", "kind": "AFP" | "הרי", "specialty": "...",
      "year": "YYYY" | null, "citation": "...", "abstract": "...",
      "sort": "...", "opening": "...", "he": "...", "filename": "..." }
  ]
}
```

`year` is **string|null** — never empty string. R2 cleanup pinned this in
`tests/afpTopicMap.test.js`. The bulk-ingestion script
(`scripts/extract_afp_hari.py`) has a known bug where it pulls the first
4-digit number it finds (often from PDF body text) — always run
`scripts/fix_afp_hari_years.py` after a re-ingest to recover years from
title/filename.

`TOPIC_TO_AFP_SPECS` (in `src/core/constants.js`) maps each of the 27 quiz
topics to one or more specialty strings. `AFP_SPEC_TO_TOPICS` is the inverse.
Round-trip is enforced in `tests/afpTopicMap.test.js` — adding a topic
requires updating both the index AND the topic map in the same commit.

## FSRS — cross-repo invariant
`shared/fsrs.js` is byte-identical with `Geriatrics/shared/fsrs.js` and
`InternalMedicine/shared/fsrs.js`. Canonical md5 `cea66a0435…`. Each repo's
CI guard pins this.

**Do NOT** edit `shared/fsrs.js` from a single-repo session. Coordinate
across all three (audit-fix-deploy Round 3 work, or a dedicated tri-repo bump).

Known issue (R2 deferred → R3): `isChronicFail()` returns `undefined` when
`fsrsD` is missing. Patch staged in `IMPROVEMENTS.md`.

## Modular build — keep the 26-module split
Pnimit's pattern, mirror exactly. Started 21 modules at v1.3.4; grew with
debug console (v1.7.x), study plan (v1.9.0), supabaseAuth (v1.8.0).

`src/` layout:
- `ai/` — explain.js (AI hint box), client.js (proxy callAI)
- `core/` — globals.js, constants.js, utils.js, state.js (LS+IDB), data-loader.js, sw-update.js, tagMigration.js
- `debug/` — 5-tap debug console
- `features/` — auth.js, cloud.js, post-login-restore.js, study_plan/{algorithm,index}.js
- `quiz/` — engine.js (buildPool + filters), modes.js (Pomodoro etc.), wrong-review.js
- `sr/` — fsrs-bridge.js, spaced-repetition.js
- `ui/` — app.js (router), quiz-view.js, library-view.js, more-view.js, track-view.js, learn-view.js, settings-overlay.js, source-link.js, tabs.js, heatmap.js
- `styles/` — CSS modules
- `clock.js`

## Tag whitelist (engine + tests guard)
`2020`, `2021-Jun`, `2022-Jun`, `2023-Jun`, `2024-May`, `2024-Sep`,
`2025-Jun`, `Goroll`, `Nelson`, `AFP`, `Exam`, `FM-Core`

`EXAM_YEARS` (in constants.js) is the canonical exam-year subset.

## Multi-accept answer grading
Some IMA keys accept multiple letters → `c_accept: [0, 2]` array.
Engine helper: `isOk(q, i)` in `src/core/utils.js`.
Regression guard: array non-empty, unique, in-bounds, **primary `c` MUST be in `c_accept`**.

## AI generation pipeline
- Bulk: `claude-sonnet-4-5` direct Anthropic API (Netlify proxy times out at 20s)
- In-app: Netlify proxy `https://toranot.netlify.app/api/claude` (shared secret header `shlav-a-mega-...`)
- Generation: 5 Qs/call, max_tokens 2500
- Hebrew reconstruction: 1 Q/call, max_tokens 2000
- Validate every Q: 4 opts, `ti` in [0,26], `t` in whitelist, primary `c` in `c_accept` if present

## Supabase architecture
- Project: `krmlzwwelqvlfslwltol` (shared with Toranot, Geri, IM, ward-helper)
- Anon key (publishable): `sb_publishable_tUuqQQ8RKMvLDwTz5cKkOg_o_y-rHtw`
- Tables: `mishpacha_backups`, `mishpacha_leaderboard`, `mishpacha_feedback`,
  `study_plans` (per-user, RLS-gated)
- Capability-token model: client generates random `uid`, stores in IDB, uses as PK.
  RLS policies are `qual=true` (anon S/I/U) — security depends on uid entropy.
  See IMPROVEMENTS.md item 8 for entropy-audit pattern.

## Critical workflows
- **CI gates**: `ci`, `deploy`, `integrity-guard`, `distractor-autopsy`, `weekly-audit` (5 workflows; user is admin and may direct-push to main bypassing branch-protection — prefer PRs for non-trivial changes)
- **Pre-push hooks**: `npm run hooks:install` once → version-trinity check + test run
- **Verify before push**: `npm run verify` runs sync-sw-version + tests + build

## Common scripts
- `scripts/build.sh` — full Vite + sw.js generation + dist verify
- `scripts/sync-sw-version.cjs` — version-trinity verifier (fails on drift)
- `scripts/verify-dist-sw.cjs` — dist/sw.js manifest verifier
- `scripts/check-innerhtml.py` + `check-innerhtml-pieces.py` — XSS guards (annotate with `// safe-innerhtml: <reason>` or wrap in `sanitize()`)
- `scripts/extract_afp_hari.py` — AFP/הר"י index regenerator (warning: extractor pulls first 4-digit number it sees; verify year metadata after run)
- `scripts/fix_afp_hari_years.py` — year cleanup pass (R2 added)

## Test count baseline (v1.22.3)
- 57 test files / 964 tests, all passing
- Baseline coverage: ~35% statements (UI is the bulk uncovered)
- Target growth: write tests at the boundary of every PR; never let coverage regress

## Hard "do NOT" list
- Don't edit `shared/fsrs.js` from this single-repo session
- Don't change Q-count without bumping `BUILD_HASH`
- Don't diverge `APP_VERSION` / `sw.js CACHE` / `package.json version`
- Don't hand-edit `dist/sw.js` (regenerated by build.sh)
- Don't fork tag whitelist without updating `EXAM_YEARS` + tests
- Don't ingest from sibling-repo PDFs (always verify "רפואת המשפחה" header)
- Don't migrate to authenticated-only Supabase mode (breaks the anonymous-use-case)

## When to escalate to audit-fix-deploy
- Pre-push regression on any of the 5 CI workflows
- Q-count change of any size (retag any `ti`, add/remove session)
- AFP/הר"י re-ingest (always re-pin `tests/afpTopicMap.test.js` invariants)
- Cross-repo FSRS work (always coordinate § C/D/E)
- Supabase schema migration (cross-repo coordination required)
