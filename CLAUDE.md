# Claude instructions — Mishpacha Mega (Family Medicine Shlav A)

Sibling PWA to **Shlav A Mega** (geriatrics) and **Pnimit Mega** (internal medicine). Shares engine, FSRS, Supabase, AI proxy.

## Current state (v1.2.12, 22/04/26)
- **943 Qs** across 7 exam sessions (2020=150, 2021-Jun=149, 2022-Jun=147, 2023-Jun=147, 2024-May=100, 2024-Sep=100, 2025-Jun=150)
- **27 topics** (`ti` range 0-26), **12 drugs**, **0 flashcards** (unused so far)
- **284 tests passing** (18 test files). Pnimit regression guards ported + Mishpacha-specific guards added
- Goroll 239 ch + Nelson 165 ch + Harrison 69 ch (cross-ref) as in-app readers
- localStorage `mishpacha_mega`, SW cache `mishpacha-v1.2.12`

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
- **Nelson peds chapters** — user will send
- **Image ingestion** — audit for image-dep Qs across the 7 sessions; Supabase bucket `question-images` uses `mishpacha_` prefix
- **Calibrate `IMA_WEIGHTS` + `EXAM_FREQ`** in `src/core/constants.js` from real tag distribution
- **Add `weekly-audit.yml`** workflow (currently has ci + integrity-guard only)
