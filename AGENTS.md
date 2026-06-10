# AGENTS.md — Mishpacha Mega (Family Medicine, שלב א)

Israeli family-medicine board-exam study PWA. Live: https://eiasash.github.io/FamilyMedicine/
Stack: Vite + ES modules (vanilla JS, 32-module split in `src/`). Entry: `mishpacha-mega.html` → `src/ui/app.js`. Hebrew RTL.

## Setup & commands
```bash
npm ci
npm run dev        # local dev
npm test           # vitest (977 tests)
npm run build      # bash scripts/build.sh → dist/
npm run verify     # FULL pre-push gate: regen_manifest --check, sync-sw-version, tests, build. MUST pass before any PR.
```
Node ≥ 18. Windows/git-bash: pass `encoding='utf-8'` to Python; never use a `VAR=x cmd` npm prefix.

## HARD RULES (do not violate)
1. **Branch `codex/<slug>` → PR. NEVER push to `main`.** GitHub Pages deploys `main` directly.
2. **Version QUARTET — bump all four together or CI/deploy breaks silently:** `package.json` "version", `sw.js` `CACHE='mishpacha-v<ver>'`, and in `src/core/constants.js` BOTH `APP_VERSION` and `BUILD_HASH` (form `'<Nq>-v<ver>'`, the `<Nq>` is the questions.json count, e.g. `1121q`). Guards: `tests/deployConfigGuard.test.js`, `scripts/verify-dist-sw.cjs`.
3. **`vite.config.js` `base` MUST be `/FamilyMedicine/`** (a sibling's name here = total 404 deploy stall; guard-tested).
4. **Question/answer edits:** quote the source (Goroll 8e primary / Nelson 22e peds / AFP 7-yr window / Israeli MOH-הר"י) in the PR before the edit. NEVER paraphrase or fabricate option text (fork-bug history v1.3.0). **NEVER import medexams or any paywalled question bank — this is a PUBLIC repo, so that = unlawful republication.**
5. **Hebrew RTL:** store UTF-8 as-is, never transliterate. Use `dir="auto"` + `unicode-bidi:plaintext`, not forced `dir="rtl"`.
6. **Shared files** `shared/fsrs.js` + `harrison_chapters.json` are byte-identical across Geriatrics/InternalMedicine/FamilyMedicine — do NOT diverge them here.

## Data & state
- `data/questions.json` (1,121 Qs) schema: `{q, o[], c, c_accept, t, st, ti, e}`. Separate `data/highyield.json` (133 AI Qs, adds `ref`). `c_accept` = array of accepted option indices; primary `c` must be in it. Topics: `TOPICS[27]` + `IMA_WEIGHTS[27]` in `src/core/constants.js`; `q.ti` = topic index.
- State: `G.S` (IndexedDB `mishpacha_mega_db`, localStorage fallback `mishpacha_mega`). `G.S.sr[qIdx]` = FSRS `{tot, ok, ef, fsrsS, fsrsD, ...}` keyed by question array index (shared `shared/fsrs.js`).
- Views: `G.tab` switch in `src/ui/app.js`; Track view `src/ui/track-view.js` has a sub-tab bar (`progress/plan/exam/more`) + heatmap + priority matrix.

## Adding questions (only legit path)
`node scripts/gen_highyield.mjs --plan "<ti>:<n>,..."` (routes through the Toranot proxy, grounded in Goroll/AFP/MOH/USPSTF, tag `AI-2026-hy`) → writes UNTRACKED `data/highyield.generated.json` → then `node scripts/verify_questions.mjs <file>` (key⟷explanation judge) AND `node scripts/audit_keys_blind.mjs <file>` (blind board audit, Opus). **AI-authored keys NEVER auto-merge** — flagged items need physician review. Vaccine-schedule questions are unreliable (guideline drift) — avoid or hand-verify.

## Good first tasks
Mobile-RTL UI fixes (overflow/contrast-AA/tap-targets/dark mode); add a correct/wrong/unanswered progress **donut** to the Track tab (the one stats visual it lacks — do NOT duplicate the heatmap/priority-matrix). Report each change.
