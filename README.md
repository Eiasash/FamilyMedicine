# Family Medicine Board Prep — Shlav A

*Mishpacha Mega — sibling of [Geriatrics Board Prep](https://github.com/Eiasash/Geriatrics) and [Internal Medicine Board Prep](https://github.com/Eiasash/InternalMedicine).*

Hebrew/English PWA for the Israeli Family Medicine Stage A (שלב א') board exam.

**Live:** https://eiasash.github.io/FamilyMedicine/
**Syllabus:** P0062-2025 (Hebrew: ספרות מחייבת לבחינת התמחות שלב א' – רפואת משפחה)
**Curriculum:** curriculum.pdf (מרץ 2023, v2.2 — מרץ 2024)

## Textbooks
- **Goroll** — Primary Care Medicine 8e, 239 chapters indexed, bundled (`goroll/Goroll_8e.pdf`)
- **Harrison** — Principles of Internal Medicine 22e, 69 chapters bundled (cross-reference)
- **Nelson** — Textbook of Pediatrics 22e, selected chapters (not yet bundled; coming)
- **AFP** — American Family Physician review articles (coming)
- **Israeli guidelines** — Hebrew Medical Association (הר"י) position papers and clinical guidelines

## Architecture
Clones Pnimit Mega's modular build (21 JS modules, 8 CSS). Shares:
- `shared/fsrs.js` FSRS-4.5 SRS
- Supabase project `krmlzwwelqvlfslwltol` (Toranot)
- AI proxy at `toranot.netlify.app/api/claude` (no client-side API key)

## Status
- **v1.x** — UI functional, **1,061 questions ingested**, Goroll + Harrison readers live
- 7 past exam PDFs staged at `exams/pdf/` (2020, 2021-Jun, 2022-Jun, 2023-Jun, 2024-May, 2024-Sep, 2025-Jun)
- 800 gold-standard answer keys extracted at `exams/answer_keys/*.json` (6 of 7 sessions complete)
- Question ingestion pending (v1.x → ~900 Qs target)

## Topics (27)
27 clusters covering Goroll + Nelson selections + Hebrew MOH + AFP frequency. See `data/topics.json`.

## Deploy
Push to `main` → GitHub Pages auto-deploys (~60s, no build step).

## Supabase tables required
- `mishpacha_backups` — progress sync
- `mishpacha_feedback` — user feedback
- `mishpacha_leaderboard` — anonymous readiness rank
- (`answer_reports` — already shared with pnimit/geri)

Policies: INSERT + UPDATE + SELECT for anon; omit DELETE.
