# Claude instructions — Mishpacha Mega (Family Medicine Shlav A)

Sibling PWA to **Shlav A Mega** (geriatrics) and **Pnimit Mega** (internal medicine). Shares engine, FSRS, Supabase, AI proxy.

## Constants
- `APP_VERSION` = 1.0, SW cache `mishpacha-v1.0`, localStorage `mishpacha_mega`
- Topics: 27 (`ti` range 0-26)
- Tag whitelist: `2020`, `2021-Jun`, `2022-Jun`, `2023-Jun`, `2024-May`, `2024-Sep`, `2025-Jun`, `Goroll`, `Nelson`, `AFP`, `Exam`

## Version sync (3 locations)
`src/core/constants.js` → `APP_VERSION` + `sw.js` → `CACHE` + `package.json` → `version`. All three must match. CI gate enforces.

## Do NOT split the modular build
Keep the 21-JS-module split. Pnimit's pattern, mirror it exactly.

## Skills hierarchy (when generating questions or reference content)
1. Goroll 8e (primary)
2. Nelson 22e (pediatric chapters per syllabus)
3. AFP review articles (7-year window, 2018-2025)
4. Israeli MOH / הר"י guidelines
5. Harrison 22e (cross-reference only — not a family med primary source)

## AI generation
- Model: `claude-sonnet-4-5` direct Anthropic API
- Proxy (`toranot.netlify.app/api/claude`) times out for bulk — use direct API for ingestion, proxy for in-app
- 5 Qs/call, max_tokens 2500
- Validate: 4 opts, ti in [0,26], `t` in whitelist

## Tests
10 ported test files, 155 tests, all pass. Pnimit-specific regression guards deleted. Re-introduce per-session count locks once exam ingestion runs.

## Pending work (next session)
- Ingest 7 exam sessions (pipeline ported from `scripts/reconstruct_with_ai.py`)
- Download AFP/HARI articles from Google Drive folder `1GGYGFe9s-BiaRSHohn5NrRf0mMk5hERB`
- Add Nelson chapters (pediatrics primary textbook — user will send)
- Create Supabase tables: `mishpacha_backups`, `mishpacha_feedback`, `mishpacha_leaderboard`
- Calibrate `IMA_WEIGHTS` + `EXAM_FREQ` in `constants.js` from real exam tag distribution
