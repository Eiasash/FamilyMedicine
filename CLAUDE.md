# Claude instructions — Mishpacha Mega (Family Medicine Shlav A)

## Operating model — single lane (from 2026-05-19)

Development on this repo is done by Claude Code directly — design,
implementation, testing, and shipping all in one session. This **supersedes**
every "two-lane", "web-lane", or "terminal-lane" instruction in older docs and
skills (audit-fix-deploy and the per-repo skills included): there is no second
Claude lane, and no `claude/web-` vs `claude/term-` branch split.

Workflow: branch `claude/<slug>` -> PR -> CI green + Codex review -> Claude Code
self-merges -> post-merge `verify-deploy`. Codex is the independent automated
reviewer. Codex green + CI green is sufficient self-merge authority.
**"Codex green" is defined as:** review state ∈ {`APPROVED`, `COMMENTED`} AND no unresolved P0 or P1 inline comments at the moment of merge. P2 inline comments may self-merge with an in-thread reply explaining the decision. Auto-merge (`gh pr merge --auto`) is **disabled** — every self-merge requires explicitly reading the latest Codex review surface and CI status before merging. If Codex has not reviewed and the PR is substantive, wait or ping; do not deadline-out a missing reviewer on non-trivial changes.

 Eias sign-off is required only for: (a) PRs touching patient-data paths (ward-helper PHI crypto, IDB roster schema, rounds-data persistence — enumerated in ward-helper codeowners, queued as follow-up PR), and (b) per-PR gate docs that explicitly carry a "NO self-merge" clause (audit-8 R1.5 / R1.6 and subsequent R1.x gates). Claude Code never self-certifies its own audit — independence comes from cross-model review (Codex), not from human-vs-AI gates. All release,
version-trinity, and verification rules in the repo's skill still apply
unchanged.


<!-- working-rules-v1:start -->
## Working Rules (user-mandated, non-negotiable)

These four rules are the floor. They override any conflicting guidance later in this file. If a rule conflicts with what you're about to do, stop and surface it before proceeding.

1. **Don't assume. Don't hide confusion. Surface tradeoffs.**
2. **Minimum code that solves the problem. Nothing speculative.**
3. **Touch only what you must. Clean up only your own mess.**
4. **Define success criteria. Loop until verified.**
<!-- working-rules-v1:end -->

Sibling PWA to **Shlav A Mega** (geriatrics) and **Pnimit Mega** (internal medicine). Shares engine, FSRS, Supabase, AI proxy.

## Current state (v1.26.5, 11/06/26)
- **+208 AI high-yield Qs** in a separate `data/highyield.json` bank (tag `AI-2026-hy`) loaded additively + labeled "AI — High-Yield" in-app; `data/questions.json` UNCHANGED (1121) so count-lock + BUILD_HASH count + cross-repo manifest/syllabus contract untouched. Audited blind (opus); 1.26.0 shipped 133 (57 flags held), v1.26.3 added 35 survivors from a 69-new pilot (34 held — 26 ambiguity flags + 8 confident blind disagreements; see `docs/AUDIT_HY_PILOT_2026-06-11.md`).
- **1121 Qs** total — 950 across 7 exam sessions (2020=150, 2021-Jun=150, 2022-Jun=150, 2023-Jun=150, 2024-May=100, 2024-Sep=100, 2025-Jun=150) + 111 `FM-Core` curated textbook Qs
- All 7 sessions CONFIRMED Family Medicine content (fork-bug remediated in v1.3.0 — see CHANGELOG)
- **27 topics** (`ti` range 0-26), **47 drugs**, **0 flashcards** (unused so far)
- **63 test files / 977 tests** under `tests/` (v1.21.15 added 2 SW regression guards: HTML_URLS *.js + CSS_URLS on-disk). Pnimit regression guards ported + Mishpacha-specific guards added + AFP topic-map / FSRS boundary tests (v1.21.1) + R2 deep coverage (quiz-engine multi-tag, study-plan DST/calendar, sw manifest, IDB mock, bidi numerics, mutation resistance — v1.21.2) + apiKeyLoginRestore covering v1.21.12-14 cloud sync + 3 P0 chaos crash fixes (v1.21.13: toLowerCase undefined, flashcards `f` undefined bounds-check, startTimedQ G-binding)
- Goroll 239 ch (local PDF, 1-tap deep-link) + Nelson 165 ch (Drive PDF via progressive-upgrade schema) + Harrison 42 ch (cross-ref, in-app reader) + Lerner 2025 329 sections (Hebrew prose, 6th Library tab, added v1.4.3)
- AFP/הר"י index: 542 papers across 23 specialties; year metadata cleaned in v1.21.2 (18 entries: 16 corrected from title/filename, 2 null sentinels). Schema invariant: `paper.year` is `string|null`, never empty string.
- localStorage `mishpacha_mega`, SW cache `mishpacha-v1.26.5`
- `shared/fsrs.js` byte-identical with § D Geriatrics + § E Pnimit (canonical git hash-object `89aa3940…`; canonical md5 `71f9f2d4…` post-LF normalization, was `cea66a0435…` pre-2026-04-22). Known issue: `isChronicFail()` returns `undefined` instead of `false` when `fsrsD` missing — patch staged in IMPROVEMENTS.md, requires Round 3 cross-repo coordinated bump.

## Recent (v1.8.0 → v1.9.1)
- **v1.9.1 study-plan tuning** — ramp stages 1-6, hpw-scaled daily Q target, tighter fixture for the in-app study plan generator.
- **v1.9.0 in-app study plan generator** — see `src/features/study_plan/{algorithm,index}.js`; Supabase table backing in `supabase/migrations/0002_study_plans.sql`.
- **v1.8.0 username/password accounts** — Supabase pgcrypto bcrypt RPCs (`src/services/supabaseAuth.js`); replaces magic-link-only flow.
- **v1.7.x debug console + AI-call hardening** — built-in 5-tap debug console (`src/debug/console.js`, persisted to localStorage), and per-call AbortController + 30s safety timeout in `callAI` (preventive port from Geriatrics v10.38.2).

## Chaos doctor-bot v4 (2026-05-08)

`scripts/chaos-doctor-bot-v4.mjs` — board-grade Israeli family-medicine physician chaos bot, replaces v3's contract bug. Per-question: AI picks A/B/C/D, app reveals correct option, AI judge validates the **app's** answer (not blends with its own pick). v3's flaw was 100% appIdx=null because it entered the app via `start-mock` (exam mode hides the answer-reveal); v4 uses practice mode + matches both `data-state="correct"` and `data-state="correct-unchosen"`.

- **Pure helper**: `scripts/lib/extractJson.mjs` — brace-balanced JSON extractor with markdown-fence stripping. 10 unit tests in `tests/chaosBotV4ExtractJson.test.js`.
- **Run**: `CLAUDE_API_KEY=$key CHAOS_USERS=10 CHAOS_DURATION_MS=21600000 CHAOS_HEADLESS=1 CHAOS_COST_CAP_USD=8 node scripts/chaos-doctor-bot-v4.mjs`
- **Output**: `chaos-reports/v4-overnight-<timestamp>/medical_findings_ai_v4.jsonl` (one JSON object per question with appIdx, aiIdx, judge verdict, optional source-check).
- **Cost-cap kill switch**: `CHAOS_COST_CAP_USD` env (default $25) — workers self-terminate when ledger crosses cap.
- **Sibling**: `InternalMedicine/scripts/chaos-doctor-bot-v4.mjs` (same lib, IM-specific selectors: `.explain-box` instead of `.quiz-feedback__body`, quiz-tab navigation step).
- **First overnight run** 2026-05-08: surfaced 46 distinct flagged FM questions where AI judge said the app's answer was wrong. Top hits include internal explanation-vs-c-index contradictions (NNT math, ALI compression-stockings vs heparin) and board-textbook disagreements. See `~/repos/FINDINGS_v4_2026-05-08.md`.

## Leaderboard RPC (v1.21.17)

`mishpacha_leaderboard_upsert(p_uid,p_answered,p_correct,p_streak,p_readiness,p_ts)` — SECURITY DEFINER RPC at `/rest/v1/rpc/mishpacha_leaderboard_upsert`. Replaces direct `/rest/v1/mishpacha_leaderboard` POST that silently failed under the new column-type mismatch (table `ts` is `bigint` epoch but client sent ISO string). RPC accepts ISO and casts server-side. Migration: `supabase/migrations/0003_leaderboard_upsert.sql`. Sibling-aligned with pnimit/shlav RPCs.

## v1.3.0 — fork-bug remediation (CRITICAL)
Before v1.3.0, 5 of 7 exam sessions (2021-Jun, 2022-Jun, 2023-Jun, 2024-May, 2024-Sep) were accidentally ingested from **Internal Medicine** PDFs rather than Family Medicine — a copy-paste residue from the initial Pnimit fork. ~593 of 943 Qs were IM content masquerading as FM. v1.3.0 re-ingested all 5 sessions from correct FM PDFs via Sonnet-4.5 image-based extraction + official IMA post-appeal answer keys (~$11, ~30 min). 2025-Jun was cosmetically refreshed (data was FM but PDF was IM). EXAM_FREQ + IMA_WEIGHTS recalibrated for true 950-Q FM corpus — new emphasis: Peds-Acute 12%, MSK 11%, EBM 8%, Geri 5%. All 18 replaced PDFs verified "רפואת המשפחה" not "רפואה פנימית".

## Version sync (3 locations — CI gate enforces)
`src/core/constants.js` → `APP_VERSION` · `sw.js` → `CACHE` · `package.json` → `version`. All three must match.

## Deploy
`git push origin main` → GitHub Actions runs `bash scripts/build.sh` (Vite build) → `dist/` deployed to GitHub Pages (~60–90s).

**Critical deploy config** (see `tests/deployConfigGuard.test.js`):
- `vite.config.js` must have `base: '/FamilyMedicine/'` — NOT a sibling repo's name. This was the exact bug that stalled the v1.2.10 deploy (was `/InternalMedicine/`, causing all hashed assets to 404). The guard test fails CI if this regresses.

## Release Invariants (run before declaring "shipped")
1. **Local trinity** — `APP_VERSION + BUILD_HASH + sw.js CACHE + package.json` all aligned. Local guards: `scripts/verify-dist-sw.cjs` + `tests/deployConfigGuard.test.js`.
2. **Tests + build** — `npm run verify` (vitest + build).
3. **Live witness** — after `git push` lands and Pages rebuilds (~60–90s), `bash scripts/verify-deploy.sh` does a two-step check: fetches live HTML, extracts the hashed `assets/mishpacha-mega-*.js` bundle path, then greps the bundle for `q-v<version>` (the `BUILD_HASH` suffix from `src/core/constants.js`) AND verifies `sw.js` shows `CACHE='mishpacha-v<version>'`. **Don't claim "deployed" until this passes.**
4. **Question content edits** — any change to `data/questions.json` `o[]` text, `c` index, or `e` explanation must quote the source (Goroll 8e / Nelson 22e / AFP) in the chat or commit message before the edit lands. Never paraphrase or fabricate option text — fork-bug remediation history (v1.3.0) shows how badly this can go wrong when sources blur between sibling repos.

## Do NOT split the modular build
Keep the 32-JS-module split in `src/` (was 21 at v1.3.4; grew with debug console, study-plan, supabaseAuth). Pnimit's pattern, mirror it exactly.

## Tag whitelist
`2020`, `2021-Jun`, `2022-Jun`, `2023-Jun`, `2024-May`, `2024-Sep`, `2025-Jun`, `AI-2026`, `AI-2026b`, `FM-Core` — the question `t` tags actually present, locked by `tests/questionsCountLock.test.js`. (`Goroll`/`Nelson`/`AFP` are source/library citation refs, not question `t` tags.)

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
- ~~**2020 answer key cleanup**~~ — done; `exams/answer_keys/2020.json` is now `usable: true` (verified 2026-05-31 audit)
- **AFP + HARI articles** — Google Drive folder `1GGYGFe9s-BiaRSHohn5NrRf0mMk5hERB`
- **Nelson page numbers** — add `page: N` to entries in `nelson_chapters.json` (from Nelson 22e ToC) to enable Drive `#page=N` deep-linking. Code already supports it; purely a data-fill task.
- **Nelson per-chapter PDFs** (optional upgrade) — drop individual PDFs into `nelson/` and set `{file: "Ch42.pdf"}` per entry to serve offline-capable from same origin (mirrors Harrison's pattern). Library UI prefers `file` > `page` > Drive root.
- **Image ingestion** — audit for image-dep Qs across the 7 sessions; Supabase bucket `question-images` uses `mishpacha_` prefix
- **Calibrate `IMA_WEIGHTS` + `EXAM_FREQ`** in `src/core/constants.js` from real tag distribution
- ~~**Add `weekly-audit.yml`** workflow~~ — done; workflows now: ci, deploy, integrity-guard, distractor-autopsy, notify-auto-audit, weekly-audit.
- ~~**Annotate `heDir(…)` innerHTML-pieces**~~ — done; both sites carry `// safe-innerhtml:` annotations (`src/ai/explain.js:29`, `src/quiz/engine.js:204`).
