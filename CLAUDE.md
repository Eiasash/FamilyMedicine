# Claude instructions — Mishpacha Mega (Family Medicine Shlav A)

Sibling PWA to **Shlav A Mega** (geriatrics) and **Pnimit Mega** (internal medicine). Shares engine, FSRS, Supabase, AI proxy.

## Current state (v1.3.4, 23/04/26)
- **950 Qs** across 7 exam sessions (2020=150, 2021-Jun=150, 2022-Jun=150, 2023-Jun=150, 2024-May=100, 2024-Sep=100, 2025-Jun=150)
- All 7 sessions CONFIRMED Family Medicine content (fork-bug remediated in v1.3.0 — see CHANGELOG)
- **27 topics** (`ti` range 0-26), **12 drugs**, **0 flashcards** (unused so far)
- **398 tests passing** (26 test files). Pnimit regression guards ported + Mishpacha-specific guards added
- Goroll 239 ch (local PDF, 1-tap deep-link) + Nelson 165 ch (Drive PDF via progressive-upgrade schema) + Harrison 69 ch (cross-ref, in-app reader)
- localStorage `mishpacha_mega`, SW cache `mishpacha-v1.3.4`
- `shared/fsrs.js` is byte-identical with § D Geriatrics + § E Pnimit (canonical md5 `cea66a0435…`)

## Recent (v1.3.3 + v1.3.4)
- **v1.3.3 Nelson → Goroll parity** — Nelson Library tab is now 1-tap (chapter row → PDF opens at the right location), same UX as Goroll. Progressive href resolution: `{file}` → local `nelson/<file>` · `{page}` → Drive `#page=N` · else → Drive root. Chapters currently ship with just `{ch, title_en, notes_he}`, so taps go to Drive root; populating `page` numbers from the Nelson ToC will flip on deep-linking without any further code change.
- **v1.3.4 BIDI hygiene pass** — `.heb` class no longer force-sets `direction:rtl`; uses `unicode-bidi:plaintext + text-align:start` so each paragraph's base direction comes from its own first strong char per UBA. English-majority AI explanations and drug names no longer reflow RTL. AI-flag banner, imgDep banner, teach-back textarea + header: `dir="rtl"` → `dir="auto"`; interpolated eFlag text wrapped in `<bdi>`.

## v1.3.0 — fork-bug remediation (CRITICAL)
Before v1.3.0, 5 of 7 exam sessions (2021-Jun, 2022-Jun, 2023-Jun, 2024-May, 2024-Sep) were accidentally ingested from **Internal Medicine** PDFs rather than Family Medicine — a copy-paste residue from the initial Pnimit fork. ~593 of 943 Qs were IM content masquerading as FM. v1.3.0 re-ingested all 5 sessions from correct FM PDFs via Sonnet-4.5 image-based extraction + official IMA post-appeal answer keys (~$11, ~30 min). 2025-Jun was cosmetically refreshed (data was FM but PDF was IM). EXAM_FREQ + IMA_WEIGHTS recalibrated for true 950-Q FM corpus — new emphasis: Peds-Acute 12%, MSK 11%, EBM 8%, Geri 5%. All 18 replaced PDFs verified "רפואת המשפחה" not "רפואה פנימית".

## Version sync (3 locations — CI gate enforces)
`src/core/constants.js` → `APP_VERSION` · `sw.js` → `CACHE` · `package.json` → `version`. All three must match.

## Deploy
`git push origin main` → GitHub Actions runs `bash scripts/build.sh` (Vite build) → `dist/` deployed to GitHub Pages (~60–90s).

**Critical deploy config** (see `tests/deployConfigGuard.test.js`):
- `vite.config.js` must have `base: '/FamilyMedicine/'` — NOT a sibling repo's name. This was the exact bug that stalled the v1.2.10 deploy (was `/InternalMedicine/`, causing all hashed assets to 404). The guard test fails CI if this regresses.

## Do NOT split the modular build
Keep the 21-JS-module split in `src/`. Pnimit's pattern, mirror it exactly.

## Tag whitelist
`2020`, `2021-Jun`, `2022-Jun`, `2023-Jun`, `2024-May`, `2024-Sep`, `2025-Jun`, `Goroll`, `Nelson`, `AFP`, `Exam`

## Clinical knowledge hierarchy (family medicine — different from Pnimit/Geri)
1. **Goroll 8e** — primary (no chapter exclusions)
2. **Nelson 22e** — pediatrics, selected chapters per syllabus appendix א'
3. **AFP review articles** — rolling 7-year window (currently 2018-2025)
4. **Israeli MOH / הר"י guidelines** + HARI / ADA / GINA / GOLD
5. **Harrison 22e** — cross-reference only, NOT a family-med primary source

## AI generation / reconstruction
- Model: `claude-sonnet-4-5` direct Anthropic API for bulk (Netlify proxy times out at 20s)
- Netlify proxy for in-app AI features (Explain, Autopsy, Chat)
- 5 Qs/call for generation, max_tokens 2500; 1 Q/call for Hebrew reconstruction, max_tokens 2000
- Validate: 4 opts, `ti` in [0,26], `t` in whitelist, primary `c` must be in `c_accept` if present

## Multi-accept answer grading (inherited from Pnimit v9.73)
Official IMA keys sometimes accept multiple letters. Store as `c_accept: [0,2]` array. Engine helper: `isOk(q, i)` in `src/core/utils.js`. Regression guard: array non-empty, unique, in-bounds, **primary `c` MUST be in `c_accept`**.

## Pending work
- **Supabase tables** — run `supabase/migrations/0001_init_mishpacha_tables.sql` once in dashboard
- **2020 answer key cleanup** — currently `usable: false` in `exams/answer_keys/2020.json`; master doc merges sources + answers, needs Sonnet pass
- **AFP + HARI articles** — Google Drive folder `1GGYGFe9s-BiaRSHohn5NrRf0mMk5hERB`
- **Nelson page numbers** — add `page: N` to entries in `nelson_chapters.json` (from Nelson 22e ToC) to enable Drive `#page=N` deep-linking. Code already supports it; purely a data-fill task.
- **Nelson per-chapter PDFs** (optional upgrade) — drop individual PDFs into `nelson/` and set `{file: "Ch42.pdf"}` per entry to serve offline-capable from same origin (mirrors Harrison's pattern). Library UI prefers `file` > `page` > Drive root.
- **Image ingestion** — audit for image-dep Qs across the 7 sessions; Supabase bucket `question-images` uses `mishpacha_` prefix
- **Calibrate `IMA_WEIGHTS` + `EXAM_FREQ`** in `src/core/constants.js` from real tag distribution
- **Add `weekly-audit.yml`** workflow (currently has ci + integrity-guard only)
- **Annotate `heDir(…)` innerHTML-pieces** — `scripts/check-innerhtml-pieces.py` flags two sites in `src/ai/explain.js:29` and `src/quiz/engine.js:197` (pre-existing from v1.2.16). Not wired into CI, doesn't block deploy, but add `// safe-innerhtml:` annotations or wrap in `sanitize()` to get the checker green.
