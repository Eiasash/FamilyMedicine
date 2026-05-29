# IMPROVEMENTS — mishpacha-mega (Family Medicine)

## 2026-05-30 — audit-fix-deploy § C pass (1 i18n fix shipped → PR #117, v1.22.3, live-verified)

**Result: AUDIT CLEAN except one shipped i18n fix (LANG-1) + two non-blocking findings logged (RI-1 headline, BC-1 tech-debt).** PR #117 merged (squash `502def3`) and **live-verified** at v1.22.3. Captain-mode session (Eias delegated; executed without per-step confirmation).

**Findings (audit, all green):**

| Check | Expected | Actual | Status |
|---|---|---|---|
| Version quartet | constants APP_VERSION === BUILD_HASH-ver === sw.js CACHE === package.json | all `1.22.3` | PASS |
| BUILD_HASH | `<Qcount>q-v<ver>` | `1061q-v1.22.3` | PASS |
| Q count | matches BUILD_HASH | 1061 | PASS |
| Per-tag breakdown | 7 sessions + FM-Core | 2020/2021-Jun/2022-Jun/2023-Jun=150, 2024-May/2024-Sep=100, 2025-Jun=150, FM-Core=111 | PASS |
| Topic coverage | every ti 0..26 ≥1 (flag <3) | all 27 ≥3 | PASS |
| Tests | ≥315 floor | **964 across 57 files**, all green (pre- and post-fix) | PASS |
| TODO/FIXME in src/ | none | none | PASS |
| console.log leaks (non-DEV) | none | the one hit is inside a changelog **string**, not code | PASS |
| `dir="rtl"` in src/ui/ | prefer `dir="auto"` | none | PASS |
| deployConfigGuard / vite base | `/FamilyMedicine/` | correct | PASS |
| Live verify (GitHub Pages) | sw + bundle carry v1.22.3 | sw `mishpacha-v1.22.3` ✓, bundle `B2e05E_p.js` carries `1061q-v1.22.3` + Hebrew strings ✓, English `Not quite` gone ✓ | PASS |

**LANG-1 (FIXED, shipped PR #117).** The quiz card still rendered 2 English visible-text strings inside an otherwise fully-Hebrew RTL exam app: feedback title `Correct`/`Not quite` (`quiz-view.js:578`) and the AI-explain button `Ask Claude`/`Retry AI explain` (`:595`). Hebraized to `נכון`/`לא נכון` and `שאל את קלוד`/`נסה שוב`. Safe: `quizViewMarkup.test.js:140` asserts the **class** `quiz-feedback__title`, not its text; no test pins the English strings; feedback colors come from `--color-success/--color-danger` CSS vars (untouched). Text-only, no logic/question/key change. 964/964 green pre- and post-edit. (Left English **aria-labels** for a later focused a11y-copy pass — kept PR tight.)

**RI-1 (HEADLINE — NOT fixed; high-value but care-requiring; surfaced to Eias as next-session fork).** The clickable "מקור" source-link feature is **100% dead in production.** `quiz-view.js:585` gates the chip on `if(!G.examMode && q.ref)`, but **0/1061 questions carry a `ref` field** (verified this pass). The entire feature is dormant: module `src/ui/source-link.js` (parseRef/renderSourceLink/openSource), CSS `.quiz-source` (`quiz-view.css:614`), the click handler (`quiz-view.js:853`), and 40+ tests in `tests/sourceLink.test.js` — none of it ever renders. Users see citations only as Hebrew prose inside `q.e` (e.g. "התשובה מבוססת על גורול פרק 46").
**Why NOT blind-backfilled** (disciplined call; honors fabrication-risk rule + corroborated by the **2026-05-10 BAILED** entry below): (1) the existing `.audit_logs/.../sources_extracted.csv` was already proven RTL-parse-corrupted (page numbers mis-grabbed as Q-numbers) and abandoned for exactly this purpose — that path is closed; (2) the dominant in-corpus marker is Hebrew `פרק N`, which `parseRef`'s `/Ch\.?\s*(\d+)/i` does not match; (3) real edition variants exist ("גורול מהדורה **7**, פרק 207" vs our Goroll **8e** `goroll_chapters.json`; "נלסון מהדורה **21**" vs our 165-entry Nelson subset) → a naive numeric map would **mis-attribute clinical sources**; (4) Lerner cites by quoted section title, not number; Nelson cites mostly out-of-range. A correct backfill is an **anchor-verified content batch** (per the `citationCoveragePilot.test.js` precedent — position-pinned, with `.audit_logs/` evidence + a count-pinning test), edition-aware, Nelson-skipped, emitting a link only where the chapter resolves in the real index — NOT a render-time regex and NOT a re-run of the bailed CSV.

**BC-1 (tech-debt, not a bug).** Two button-class systems coexist — BEM (`btn--primary/secondary/ghost`) and legacy (`btn-p/btn-o/btn-g/btn-d`). All legacy classes ARE defined (`components.css` + dark-mode in `theme.css` + a11y note in `layout.css`), so buttons render correctly; purely stylistic. Plus ~58 raw inline-styled `<button>` across `src/ui` (app.js share/close, library-view add-qs, …). Too broad for a small single-purpose PR; defer to a dedicated UI-consistency pass.

**RLS sanity pass: NOT TRIGGERED (logged per rule).** PR #117 touches zero schema/migration/table/policy/role/grant surface — pure client-side copy + version strings. The Phase-1 RLS check is only required for schema-adjacent work; recorded here as deliberately not-run, not skipped.

**Why minimal change shipped:** repo is genuinely clean (964-test floor = 3× the 315 baseline; version/hygiene/coverage all green). Adding tests or refactors "for the sake of it" violates Working Rule 2 (minimum code that solves the problem). The one real user-facing defect (English strings in a Hebrew app) was fixed; the one high-value latent issue (RI-1) is correctly deferred to an authorized content workstream rather than risk fabricated citations.

## 2026-05-10 — FM source-citation backfill — BAILED (dataset unreliable)

**Goal.** Use `.audit_logs/topic_analysis_2026-05-03/sources_extracted.csv` (advertised: "1231 source rows extracted from FM exam source-reference PDFs") to close the 83% citation-coverage gap surfaced in PR #53 (878/1061 FM Qs without recognizable source).

**Bail decision: dataset is structurally unusable for per-Q citation backfill.** No `q.e` edits made. No follow-up batch backfill PR is recommended against this dataset — fix the upstream extractor first, or pull citations directly from the source-reference PDFs in a separate authorized workstream.

### What is in `sources_extracted.csv`

- 1231 rows, columns: `specialty, session, year, stage_or_track, source_pdf, question_number, answer_in_source_doc, reference_type, chapter, source_text`.
- Reference-type distribution looks plausible at first glance: Goroll 492, AFP/Article 294, Nelson 154, Unclassified 118, Guideline/Law 81, ADA 45, Israeli preventive 22.
- **But only 367/1231 rows (29.8%) populate `question_number` at all** — 864 rows have a citation string but no Q-linkage.

### Why the 367 rows that DO have Q-numbers are still unusable (RTL parse bug)

Cross-checked 5 sampled rows with `question_number` against the upstream PDF text in `inventory.csv`. All 5 are mis-parsed:

| Row | Bot says | PDF actually says (from inventory `sample`) | Bot bug |
|---|---|---|---|
| 1 | q=202 (2020 exam) | n/a | impossible — 2020 FM has 150 Qs |
| 2 | q=376, source="376 עמוד46 גורול פרק" | "1ב גורול פרק46 עמוד376" = Q1 ans-ב, Goroll ch46 p376 | grabbed PAGE NUMBER (376) as Q-num |
| 3 | q=139, source="1397 עמ' 207 פרק 7 גורול מהדורה ב 2" | "2ב גורול מהדורה7 , פרק207 ,עמ ' 1397" = Q2, Goroll 7e ch207 p1397 | grabbed truncated page (1397→139) as Q-num |
| 4 | q=124, source="1245 עמ' 973 עמוד 134 גורול פרק ד,א 3" | "3א,ד גורול פרק134 עמוד973 , עמ ' 1245" = Q3, Goroll ch134 p973-1245 | grabbed truncated page (1245→124) as Q-num |
| 5 | q=138, source="1388 עמ' 203 גורול פרק א 5" | "5א גורול פרק203 ,עמ ' 1388" = Q5, Goroll ch203 p1388 | grabbed truncated page (1388→138) as Q-num |

**Root cause: the upstream extractor regexed in left-to-right order on RTL Hebrew text.** In Hebrew RTL the leading character is the Q-number (`1ב`, `2ב`, `3א,ד`...); the trailing digits are the page number. The bot anchored on the trailing run instead, so every "question_number" in the dataset is actually a page number — and `source_text` is also reversed/scrambled because the columns were extracted in the wrong direction.

**Same bug class** as the Geriatrics qnum-matcher v1 incident (per memory `project_geriatrics_qnum_matcher_unreliable`): RTL/BIDI parser shipped without verification produces a "+1 shift" / wrong-end-of-line capture that looks plausible until you cross-reference the source.

### Sample-verify result

Reliability gate: **0/5 HIGH, 0/5 AMBIGUOUS, 5/5 WRONG**. No need to sample more — the bug is structural, not noise. Per spec ("<5/10 HIGH → BAIL"), bail.

### Secondary issues (would block backfill even if Q-nums were correct)

1. **Session column collapses** to bare year (`2020`) instead of session label (`2020-06 Stage A`) — even with valid Q-nums, this prevents disambiguating which of 7 FM exam sessions a citation belongs to. Multiple sessions per year exist (2024 has both 2024-May and 2024-Sep).
2. **864 rows with no Q-num at all** (70%) are pure citation strings without exam linkage.
3. The `sources_extracted.csv` "rows" appear to be one-row-per-line in the PDF rather than one-row-per-Q — option text and stem fragments leak in alongside the citation rows (see rows 2-15 of the file: "ב .צילום של מפרק הירך AP" is option text from Q-stem, not a source citation).

### What IS recoverable (recommendation, not this PR)

The raw signal exists, just not in this CSV. The 8 `source_reference` PDFs (`pdf_type=source_reference` in inventory.csv: 643320, 643328, 643333, 643337, 643342, 643343, 643344, 749663) contain clean `<qnum><answer-letter> <reference>` tables in `מס שאלה / מראה מקום` format. A re-extraction pass against those 8 PDFs — with proper RTL handling, mirroring Geri's v3 token-overlap matcher pattern — would yield the per-Q citation table this PR was meant to consume. That is a separate authorized workstream, not a stretch of this one.

### Action

This PR ships the audit memo only:
- No `q.e` edits.
- No `q.c` touches (the 51 `answer_key_changes.csv` entries remain untouched and out of scope).
- No quartet bump (memo-only PR).
- IMPROVEMENTS.md updated (this section).

### Open follow-up (requires explicit user authorization)

1. **Fix the upstream RTL extractor** (or rebuild it from the source-reference PDFs with RTL-aware parsing) — produces a correct `qnum → reference` mapping for the ~7 FM exam sessions covered by source-reference PDFs.
2. Once a verified mapping exists: ship a follow-up PR that prepends a `[Goroll 8e ch 47 p612]`-style citation prefix to the existing `q.e` for each mapped Q, in batches of ~50, with the source quote in each commit message.
3. Any sessions without a source-reference PDF (per inventory: 2021-06 Stage B, 2024-Sep, possibly others) cannot be backfilled from this dataset — they would need direct PDF source-pull from `.audit_logs/exam_pdfs/` per session.

---

## 2026-05-10 — questions.json comprehensive quality audit (audit + minimal autofix)

**Scope.** Read-only multi-dimensional scan of all 1061 Qs across schema completeness, source-citation coverage, explanation coverage, format hygiene (beyond existing 10 regression guards), distribution health, and cross-field consistency. Then a strictly-mechanical fix pass for whitespace-only defects. NO `q.c` flips, NO `q.e` fabrication, NO `q.o[]` text changes — those would require a per-Q source-pull pass that is out of scope for one PR (and would repeat the v9.81 idx 510 incident class).

**Baseline at start.** v1.21.18, 1061 Qs, 53 test files / 845 tests passing. The existing 10 regression guards (ð-mojibake, Latin-1 adjacency, Hebrew+digit missing-space, ?heb wrong-side, fragment bleed, dupes, c-vs-explanation drift, stem/option length, c_accept schema, deploy-config) are clean — meaning the format-hygiene dimensions they cover are at zero defects. This audit covers untested dimensions.

### Schema completeness — CLEAN

| Dimension | Count |
|---|---|
| Missing `q` (stem) | 0 |
| Missing `o` (options array) | 0 |
| `o.length` outside [2, 5] | 0 |
| Missing `c` | 0 |
| `c` out of range vs `o.length` | 0 |
| Missing `c_accept` | 0 |
| Missing `t` (year tag) | 0 |
| Missing `ti` (topic idx) | 0 |
| `ti` outside [0, 26] | 0 |
| `c_accept` does not include `c` | 0 |

Zero schema gaps across 1061 Qs. Nothing to surface.

### Mechanical fixes shipped (this PR)

| Fix | Count | Sample idx |
|---|---|---|
| Whitespace trim on `q` (trailing space) | 1 | 829 |
| Internal double-space collapse on `q` | 2 | 100, 353 |

That's it. Three character-level changes.

### Format quality — surfaced but NOT auto-changed (verified deliberate content)

The audit also surfaced these patterns. Spot-checking each confirmed they are intentional content rather than noise — the renderer or domain treats them as semantic, so stripping them would degrade content:

| Pattern | Count | Why NOT auto-fixed |
|---|---|---|
| `**bold**` markdown in `q.e` | 50 | `src/ui/quiz-view.js:538` renders `**...**` → `<b>...</b>`. This is a supported convention. |
| `**bold**` markdown in `o[]` | 5 | Same — option text passes through the same renderer. |
| Unicode arrows (`→ ← ↑ ↓`) in `q.e` | 10 | Clinical algorithm/sequence notation (e.g. Raynaud `לבן→כחול→אדום`, Kübler-Ross stages, vaccine sequences `PCV15→PPSV23`). |
| Unicode arrows in `o[]` | 2 | Same — clinical sequences inside option text. |
| `q` ending without `?.!:` | 6 | All end with `]` (image refs like `[שאלה תלוית תמונה]`), `Olson` (model name), or `-` (dash list continuation). Real punctuation; not defects. |
| Hebrew letter + digit (no space) | 2 | `כ3 ס"מ` and `1כ-1 ס"מ` — typo-style but rare and localized; mass auto-rewrite risks breaking measurements. |

### Surfaced for direction (NOT shipped — requires source-citation pass)

#### Source coverage — most explanations are pedagogically substantive but unsourced

`q.e` is FM's only carrier of source citation (no separate `q.ref` field exists in this schema, unlike some siblings). Two passes were run with widening regex sets:

**Narrow pass (textbook-only):** Goroll 22 + Nelson 3 + AFP 4 + UpToDate 3 + CDC 6 + WHO 11 + Harrison 0 + הר"י 0 = ~46 Qs cite a textbook by name.

**Broad pass (textbook OR society guideline OR Israeli law/MoH OR generic "הנחיות" mention):** 183 / 1061 Qs (17%) match at least one source/authority/guideline pattern.

The remaining 878 Qs (83%) have substantive multi-sentence Hebrew explanations grounded in correct medicine but do not cite a recognizable source — they read as authoritative didactic prose ("על פי ההמלצות…", "התיאור מתאים ל…", "הטיפול המומלץ…"). This is a documentation gap, not a content gap.

| Source family (broad pass, in `q.e`) | Count |
|---|---|
| Goroll | 22 |
| Nelson | 3 |
| Harrison | 0 |
| AFP / American Family Physician | 4 |
| הר"י / IMA task force | 2 |
| UpToDate / Up-To-Date | 3 |
| NICE / CDC / WHO / USPSTF | 38 |
| Israeli law / MoH guideline | 19 |
| Society guidelines (AAD/AHA/ACC/ACOG/ACS/ADA/AAP) | 30 |
| Generic "הנחיות" / "המלצות" / "פרוטוקול" / "guideline" | 94 |
| Page reference (`עמ' N` / `p. N`) | 4 |
| **Union (Qs matching ≥1 above)** | **183 / 1061 (17%)** |

#### Explanation depth — generally healthy

| Pattern | Count |
|---|---|
| Missing `e` entirely | 0 |
| Weak `e` (<50 chars) | 0 |
| Short `e` (<100 chars) | 2 |
| `e` mostly repeats the chosen option text | 0 |

`q.e` coverage is essentially complete and substantive. Two short explanations exist but are not pathological — they're concise rather than placeholder.

#### Per-tag distribution — matches CLAUDE.md spec

| Tag | Count | Spec target |
|---|---|---|
| 2020 | 150 | 150 |
| 2021-Jun | 150 | 150 |
| 2022-Jun | 150 | 150 |
| 2023-Jun | 150 | 150 |
| 2024-May | 100 | 100 |
| 2024-Sep | 100 | 100 |
| 2025-Jun | 150 | 150 |
| FM-Core | 111 | 111 |

Per CLAUDE.md, exact match. No tag drift.

#### Per-topic distribution — no underflow

All 27 `ti` slots have ≥ 16 Qs; none below 5 Qs threshold. Distribution clusters around `ti=24` Peds-Acute (115), `ti=9` MSK (100), `ti=26` EBM (75) — consistent with the `EXAM_FREQ` calibration in `src/core/constants.js`. Lightest topics: `ti=19` Addictions (16), `ti=0` Adult Cardiology (20), `ti=16` Mens Health (20), `ti=21` Pain/Palliative (20).

### Recommended drain strategy (NOT in this PR)

| Workstream | Out of scope here because |
|---|---|
| Source-citation backfill (878 Qs without recognized source) | Requires per-Q PDF cross-ref against Goroll 8e / Nelson 22e / AFP / Israeli MoH guidelines. Cannot be auto-generated without grounding. The `.audit_logs/topic_analysis_2026-05-03/` bundle (FM 1231 sources for 642 Qs) is the staging point if/when a future drain PR opens. |
| Explanation strengthening for 2 short `q.e` cases | Per § 4 release invariants: changes to `q.e` must quote the source. Hand-pull the 2 Qs in a future content PR. |
| Per-topic enrichment for the 3 lightest topics (Addictions 16, MSK-baseline-cardiology 20, Mens Health 20) | Author new Qs from the FM PDFs in `.audit_logs/exam_pdfs/`; not a one-touch fix. |
| Suspect `q.c` review | Per the chaos-doctor v4 first run findings (46 distinct flagged FM Qs), each flag needs human medical verification. The bot-flag→curator-override pattern from sibling Geri's Track-J/L/O (~70% of bot flags were false-positive — IMA/key was right) means automated `c` flips are unsafe. Surface, do not flip. |

### Audit methodology (preserved out-of-tree)

The audit script `tmp_quality_audit.cjs` and its outputs `audit_output.txt` / `audit_output.json` / `audit_source_broad.json` are gitignored and removed before commit (single-use; rerun by re-creating from this memo's spec if needed).

---

## 2026-05-10 — ESLint 10 warning categorization (audit-only memo)

**Read-only triage of the lint surface revealed by PR #46 (Vite 8 + ESLint 10 majors upgrade).** No source-code edits in this pass. Goal: size the drain, identify what can be auto-fixed, and surface what cannot.

**Actual counts** (from `npx eslint . --format json` on commit at `claude/term-lint-categorization-audit-2026-05-10` head):

| Severity | Count |
|---|---|
| Warnings | 187 |
| Errors | 63 |
| **Total** | **250** |

(The brief mentioned "187 warnings + 7 errors" — the warning count matches; the error count is 63, not 7. Worth flagging for the next audit pass.)

### By rule

| Rule | Severity | Count | Top files |
|---|---|---|---|
| `no-unused-vars` | error | 185 | `src/ui/app.js` (86), `src/features/cloud.js` (15), `src/ui/library-view.js` (13), `src/ui/track-view.js` (13), `src/quiz/engine.js` (9) |
| `no-undef` | error | 51 | `sw.js` (34), `chaos-reports/full-run-v1-killed-at-33min/aggregate-findings.cjs` (9), `chaos-reports/full-run-v1-killed-at-33min/medical-content-scan.cjs` (8) |
| `no-useless-escape` | error | 9 | `chaos-reports/full-run-v1-killed-at-33min/medical-content-scan.cjs` (4), `tests/textbookChapters.test.js` (3), `src/core/constants.js` (2) |
| `prefer-const` | warn | 4 | `src/core/state.js`, `src/features/cloud.js`, `src/quiz/engine.js`, `src/ui/library-view.js` (1 each) |
| `no-empty` | error | 1 | `shared/install-promo.js` |

**Note on severity vs warning/error split:** ESLint 10's recommended config promotes `no-unused-vars`, `no-undef`, `no-useless-escape`, `no-empty` to **error** by default. `prefer-const` is the only true warn-level rule firing. CI is presumably green only because lint isn't gating CI yet.

### `no-unused-vars` subcategorization (185 total)

| Sub-pattern | Count | Auto-fixable? |
|---|---|---|
| `unused-binding` (`'X' is defined but never used`) | 170 | No — ESLint 10 does not auto-fix declared variables (semantically unsafe — could hide intentional declarations or destructuring patterns). |
| `assigned-but-unused` (`'X' is assigned a value but never used`) | 9 | No |
| `unused-arg` (`'X' is defined but never used. Allowed unused args must match /^_/u`) | 6 | No — but trivially satisfiable by renaming param to `_X` |

**`no-undef` is environment-config noise, not real bugs:**
- `sw.js` (34) — uses `self`, `caches`, `fetch`, `clients`, `URL`, `indexedDB`. Service-worker globals; needs `env: { serviceworker: true }` (or `globals: globals.serviceworker`) in `eslint.config.js`.
- `chaos-reports/full-run-v1-killed-at-33min/*.cjs` (17) — uses `__dirname`, `console`, `process`. Node CommonJS globals; either ignore `chaos-reports/**` (it's generated/legacy report tooling) or add a node-globals override for `*.cjs`.

### Auto-fix reality check

`npx eslint . --fix` will only clear **4 warnings** (the `prefer-const` set). Per ESLint's `fix` field on each message:

| Rule | Reported | Has `fix` payload | Has only `suggestions` |
|---|---|---|---|
| `prefer-const` | 4 | 4 | 0 |
| `no-useless-escape` | 9 | 0 | 9 (suggestions only — needs `--fix-suggestions` or manual review per regex site) |
| `no-empty` | 1 | 0 | 1 |
| `no-unused-vars` | 185 | 0 | 0 |
| `no-undef` | 51 | 0 | 0 |

`no-useless-escape` is *not* auto-applied by `--fix` because the regex semantics can change (`\.` vs `.` in a character class, `\/` vs `/` outside delimiters). Each site needs eyeball review.

### By drain difficulty

| Bucket | Count | Effort estimate |
|---|---|---|
| **TRIVIAL** — `prefer-const` (auto-fix), `no-undef` (config-only fix in `eslint.config.js`) | 4 + 51 = **55** | ~10 min total: one `--fix` invocation + one config-file edit (sw.js → serviceworker globals; `chaos-reports/**` → ignore or node-cjs override) |
| **SAFE-MANUAL** — `unused-arg` rename to `_X`, `assigned-but-unused` deletion | 6 + 9 = **15** | ~30s/site = **~8 min**, but needs human eyes on each "assigned-but-unused" to confirm the side-effect-free RHS isn't load-bearing (e.g. lazy getter) |
| **MEDIUM-MANUAL** — `unused-binding` (declared but never read; could be unused imports / dead exports / leftover destructuring / catch params) | **170** | ~1 min/site = **~170 min** if treated as bulk delete; faster if grouped by file (86 sit in `src/ui/app.js` alone — likely many obsoleted handler imports) |
| **RISKY** — `no-useless-escape` in regex contexts (`src/core/constants.js` is hot path; `tests/textbookChapters.test.js` parses real Hebrew refs) | **9** | ~5 min/site = **~45 min**, must check that the regex still matches the same strings before & after each escape change. Regex over Hebrew/medical-text is exactly where "harmless" escape removals silently change matches. |
| **DEFER** — `no-empty` in `shared/install-promo.js:82` | **1** | <2 min, but `shared/install-promo.js` is a workspace-level cross-repo file — see `.shared/README.md`. Fix in `.shared/` and propagate, not in FM in isolation. |

### Recommended drain strategy

| PR | Scope | Risk | Reviewer cost |
|---|---|---|---|
| **PR1 (autonomous)** | `eslint.config.js` only — add `serviceworker` globals for `sw.js`, ignore `chaos-reports/**` (or add node-cjs override). Clears **51 `no-undef`** with zero source-code touch. | Low (config-only) | <2 min |
| **PR2 (autonomous)** | `npx eslint . --fix` — clears **4 `prefer-const`** in 4 files. Diff is 4 `let → const` lines. | Trivial | <2 min |
| **PR3 (semi-auto)** | Rename **6 `unused-arg`** params to `_<name>` per `Allowed unused args must match /^_/u` convention. Mechanical edit, but each site needs a glance to confirm the param is part of an externally-imposed signature (Promise constructor, event handler) rather than dead code. | Low | ~5 min |
| **PR4 (semi-auto)** | Delete **9 `assigned-but-unused`** assignments. Each one is `const x = expr;` where `expr` may have side effects. Per-site spot check. | Medium | ~10 min |
| **PR5 (manual, file-batched)** | Drain **170 `unused-binding`** by file — e.g. one PR for `src/ui/app.js` (86 sites), one for the long-tail (84 sites across ~15 files). Half the binding-only warnings are likely dead imports left over from the v1.21.x quiz-engine refactor. Visual diff per file. | Medium-Low (most are dead imports) | ~30 min/PR × 2 PRs |
| **(deferred)** | **9 `no-useless-escape`** + **1 `no-empty`**. Per-site review only. `shared/install-promo.js` `no-empty` should land in `.shared/` first, then propagate to all 6 sibling repos in one coordinated bump. | Risky in regex context | Per-site, no batching |

**Net**: PR1 + PR2 alone clear **55 of 250** (22%) for ~5 min of autonomous work and a near-zero-risk diff. PR3 + PR4 clear another **15 / 250** (6%) with ~15 min of light review. Bulk of the surface (170 unused bindings) is mechanical-but-volume work, best batched by file.

### What I am NOT recommending

- **Single mega-PR clearing all 250** — review fatigue, revert risk on a semantically-loaded rule like `no-unused-vars` where each "dead" binding could be a load-bearing destructuring slot (e.g. tuple position) or an intentional re-export.
- **Forcing `--fix-suggestions`** on `no-useless-escape` — will silently change regex behavior in `src/core/constants.js` (hot path, AFP/Goroll/Nelson/Harrison ref parsers) and `tests/textbookChapters.test.js`. Each site needs to be eyeballed against the strings it's parsing.
- **Bumping lint to a CI-gating step in this pass** — current state is that 250 lint reports do not block CI. Promoting lint-to-CI before draining the queue would mass-fail every existing PR. PR1+PR2 should land first; CI-gate is a separate later decision.
- **Editing `shared/install-promo.js` in FM directly** — that file is workspace-shared per `.shared/README.md`. The `no-empty` fix needs to land in `.shared/install-promo.js` and be propagated to all 6 siblings in the same session, or `auto-audit` will open issues within 30 min.
- **Touching `chaos-reports/**` source** — it's generated/checkpoint artifact tooling from a 33-min killed run, not production code. Cheaper to ignore-glob it than to drain it.

### Mechanical reproducer for the next audit
```bash
cd C:\Users\User\repos\FamilyMedicine
npx eslint . --format json > .fm_lint.json 2>/dev/null
# then run .lint_summarize.py / .lint_subcat.py / .lint_fixable.py (transient scripts; not committed)
```

**No version bump.** **No quartet bump.** Memo-only PR; live verify-deploy still PASSES at v1.21.18.

---

## 2026-05-10 — audit-fix-deploy § C pass (clean — no version bump)

**Result: AUDIT CLEAN.** No code changes shipped. No version bump needed. Live verify-deploy PASSES at v1.21.18.

**Findings (all green):**

| Check | Expected | Actual | Status |
|---|---|---|---|
| Version trinity | constants.js APP_VERSION === sw.js CACHE === package.json | All three at `1.21.18` | PASS |
| BUILD_HASH (FM quartet) | `<Qcount>q-v<APP_VERSION>` | `1061q-v1.21.18` | PASS |
| Q count | matches BUILD_HASH | 1061 | PASS |
| Per-tag breakdown | 7 sessions + FM-Core | 2020/2021-Jun/2022-Jun/2023-Jun=150 each, 2024-May/2024-Sep=100 each, 2025-Jun=150, FM-Core=111 | PASS |
| Topic coverage | every ti 0..26 ≥1, flag <3 | All 27 topics ≥16 Qs (min ti=19 at 16, max ti=24 at 115) | PASS |
| Tests | ≥315 | **845 across 53 files**, all passing | PASS |
| `shared/fsrs.js` sibling contract | git hash-object = `89aa3940a942c03201d9d89db02a90665b2910a8` | matches Geriatrics + InternalMedicine + FamilyMedicine | PASS |
| Build → dist/ | all assets present | data/, shared/, exams/ (67), harrison/ (69), goroll/ (1), docs/references/afp_hari/ (566) | PASS |
| `dist/sw.js` CACHE | `mishpacha-v1.21.18` | OK (verify-dist-sw.cjs: 19 cached paths, 6 shell + 7 critical + 6 lazy) | PASS |
| Live verify-deploy.sh | exit 0 | bundle BUILD_HASH `q-v1.21.18` PASS + SW CACHE `mishpacha-v1.21.18` PASS | PASS |
| TODO/FIXME in src/ | none | none | PASS |
| console.log leaks (non-DEV) | none | none | PASS |
| `dir="rtl"` in src/ui/ | prefer `dir="auto"` | none found | PASS |
| `render()` detach antipattern (`onchange/onclick=...;render()`) | none | none | PASS |
| Skipped tests (`.skip(`/`.todo(`) | none | none | PASS |

**Skill text drift surfaced (not blocking — informational):**
The audit-fix-deploy SKILL.md § C still says: `950 questions … 2021-Jun=149, 2022-Jun=147, 2023-Jun=147 … 398 tests across 26 files … APP_VERSION='1.3.4'`. Actual reality is 1061 Qs / 150 per year for those three / 845 tests across 53 files / v1.21.18. The repo has moved 11 minor versions and ~447 tests beyond what the skill document remembers. Per the canonical pipeline, that is a skill-text update concern, not a repo concern.

**Currency drift in CLAUDE.md (fixed in this pass):**
- Test count was `49 / 801`, updated to actual `53 / 845`.
- Date stamp `08/05/26` → `10/05/26`.
- `shared/fsrs.js` md5 reference was the pre-LF-normalization `cea66a0435…`; updated to current canonical (`git hash-object 89aa3940…`, md5 `71f9f2d4…` post-2026-04-22 LF normalization, with the old md5 retained for historical reference).

**Why no code change shipped:** the FM repo is genuinely in a clean state. v1.21.18 closed the chaos-bot-v4 served↔canonical option-frame bug (PR #44, 7f1304c, 2026-05-08). No new audit-finding to address. Adding tests "for the sake of testing" violates Working Rule 2 ("Minimum code that solves the problem. Nothing speculative.") — the existing 845-test floor already exceeds the 315 baseline by 2.7× and covers every regression guard, FSRS boundary, parser bleed, leaderboard hook, and chaos-bot extractor.

**Open follow-ups (not addressed this pass — pre-existing):**
- Skill-text drift in `~/.claude/skills/audit-fix-deploy/SKILL.md` § C (line 399, 401, 402, 415-418).
- Pre-existing `// safe-innerhtml:` annotation TODO in `src/ai/explain.js:29` and `src/quiz/engine.js:197` (per CLAUDE.md "Pending work" — not wired into CI, doesn't block deploy).
- Schema converge for the cross-sibling leaderboard table-shape mismatch (separate workstream — see 2026-05-07 entry below).

## 2026-05-07 (evening) — Cross-sibling leaderboard zero-write bug (top-line, NOT chaos-related)

Discovered during the chaos-run cleanup verification (web Claude SELECT counts via Supabase MCP). Independent of the chaos work itself — surfacing here as a strategic finding.

**State across the three medical PWAs that share `krmlzwwelqvlfslwltol`:**

| App | Leaderboard table | Row count ever | `submitLeaderboardScore` write path |
|---|---|---:|---|
| Geriatrics (shlav-a-mega) | `shlav_leaderboard` | **4** | direct `POST /rest/v1/shlav_leaderboard` (verified at `shlav-a-mega.html:4144`) |
| FamilyMedicine (mishpacha) | `mishpacha_leaderboard` | **0 ever** | direct `POST /rest/v1/mishpacha_leaderboard` (verified at `src/features/cloud.js:30`) |
| InternalMedicine (pnimit) | `pnimit_leaderboard` | **0 ever** | direct `POST /rest/v1/pnimit_leaderboard` (assumed from sibling parity, not directly verified) |

**Likely root cause (corrected from initial draft):** **all three siblings use direct table POST for leaderboard — none of them use an RPC.** The earlier draft of this entry incorrectly attributed Geri's 4 rows to a v10.64.42 Track-Q RPC migration; that's wrong on verification. Track-Q (commit `69e91e1`) migrated `samega_backups` to a `backup_set` RPC, **not** `shlav_leaderboard`. The leaderboard write path was untouched.

The most likely explanation for Geri having 4 rows while FM+Pnimit have 0:
- The 4 Geri rows likely **predate the `sb_publishable_*` key migration** (commit `99361cf` — "security: migrate Supabase client from legacy JWT anon key to publishable key"). On the legacy anon JWT, direct table POST under permissive RLS worked. After the key migration, the same write path returns silent 401 / PG 42501 — same class as Track-Q caught for backups.
- FM and Pnimit either migrated to publishable key with no rows ever inserted, or they had stricter RLS from the start, or they had different historical write timing. **Not directly verified** — needs a per-table policy + insert-time inspection.

What this means in practice: **leaderboard is dead silent on all three siblings *now***. Geri's 4 rows are historical artifacts; nothing is being added today on any of them.

**Schema drift (user-reported, not independently verified in this session):**
- `mishpacha_leaderboard` reportedly has both `updated_at` + `ts bigint`
- `shlav_leaderboard` and `pnimit_leaderboard` reportedly have `ts timestamptz` only

If accurate, the schema converge has to happen alongside the write-path fix — picking one timestamp shape across the three. (Verify before scoping the fix; my memory of these schemas isn't independent.)

**Scope (estimate, not commitment):** the right fix appears to be a `leaderboard_upsert(p_app, p_uid, p_payload)` SECURITY DEFINER RPC modeled on Track-Q's `backup_set`, plus client migrations in all **three** sibling `submitLeaderboardScore` callsites, plus the schema converge. **Loose estimate ~1 day of work for the FM+Pnimit client side; Geri also needs the same client migration even though it has 4 historical rows.** Schema-converge touches production tables (currently empty for FM+Pnimit, populated for Geri) — **migration plan needs review before it runs**, not a casual sibling-port.

**Open follow-ups:**
- Verify the schema drift claim against the actual Supabase project before scoping (web Claude or MCP-authed terminal can do this in 2 min).
- Audit similar surfaces (`cloudBackup`, `answer_reports`, `mishpacha_feedback`) — all 4 wrote 0 rows from the chaos run despite ~7-10 expected leaderboard submits. **Two competing hypotheses to disambiguate**: (a) the same RLS-class bug hits all FM direct-POST paths, OR (b) `start-mock` mode silences these triggers (the bot never reaches the code paths that fire `submitLeaderboardScore` / `cloudBackup`). The v4 chaos bot's "force session-end + manual cloudBackup" design will tell us which.
- For users running v1.21.x today: leaderboard never has worked. The feature is dead silent. Surface to the user-population in next changelog or quietly dormant the UI until fixed.

---

## 2026-05-07 (evening) — v1.21.16 AI-judge chaos run (Phase 4b doctor-bot)

**Trigger:** Phase 4b chaos plan against live FM v1.21.15, escalated mid-session by user to "improve the bots / 10 full upgrades / human-like / answer questions / judge medicine / write stuff / check sources." Built `chaos-doctor-bot.mjs` (v3 — AI-judge bot) on top of `chaos-live-bot-v2.mjs` (v2 — human-like click-bot), launched 10 workers × 30 min against the live URL.

**Mid-session live shipped to v1.21.16** (commit `b379011`, auth-error UX port from ward-helper PR #100) — bot's selectors had to retarget on the fly: `sd-check`/`sd-next` (v1.21.15 sudden-death path) → `check-answer`/`next-q` (v1.21.16 main quiz path). Both kept in code with backward-compat OR-selector for older renders.

### Run results

| Metric | Value |
|---|---|
| Duration / users / questions | 30 min × 10 workers × **585 Qs answered** |
| AI calls | pick=937, judge=585, source=0 (total 1522, 0 hard failures) |
| ai-parse-errors (model returned non-JSON) | **352 (~38% of pick attempts)** |
| Tokens / cost | 708,316 in + 203,046 out = **$5.17** at Sonnet 4.6 list price |
| Pageerrors (P0 candidates) | **0** |
| Direct AI-vs-app disagreements | 0 (**but detector was flawed — see below**) |
| Judge-flagged Qs | 7 occurrences of **1 unique question** (mammography screening) |
| Per-worker spread | Workers 2,3,4,5,6,7,9 cleared 60-83 Qs each; 8/1/10 stalled on parse-errors (0/1/42 Qs, 154/139/59 bugs) |
| Feedback / answer_reports submissions | 0 each (selectors didn't fire — needs investigation) |

### Methodology bugs to fix before next chaos run

1. **Exam-mode `appIdx` detection is wrong.** Bot clicks `start-mock` → exam mode. In exam mode `data-state="correct"` is set on the **picked** option, not the answer key (per `src/ui/quiz-view.js:511`). So `appIdx === aiIdx` always, and the disagreement-count is meaningless. **Fix**: switch ensureOnQuiz to prefer `start-sd` (sudden-death single-Q, non-exam mode) so `data-state="correct"` reflects `q.c`. Or detect both `correct` AND `correct-unchosen` since the unchosen-but-correct option carries the actual key.
2. **38% AI parse-error rate** = Sonnet sometimes wraps strict-JSON in code fences or adds prose. **Fix**: tolerant JSON extractor (regex-strip `^```json` and `^```` fences before parsing) + on parse-fail issue a single repair call with the raw text and "extract just the JSON".
3. **0 source-checks fired** = the citation regex `/(Goroll|Harrison|Nelson|Lerner|הר['"]י|AFP)\s*…\s*\d{1,3}/` never matched. Either explanations don't carry these patterns at the moment of capture, or `extractExplanation` (`.card` first innerText) doesn't reach the citation paragraph. **Fix**: extract explanation more reliably (look for the explanation card by data-attribute or sibling-of-options), and broaden regex.
4. **Feedback / answer_reports selectors didn't fire**. The `[data-action*="feedback"]` / `[data-action*="report"]` greps probably miss the actual v1.21.16 submission paths. **Fix**: read FM's current source for canonical action names before next run.
5. **Bot wrote 0 rows to ALL FOUR cloud-write tables** (`mishpacha_leaderboard`, `mishpacha_feedback`, `mishpacha_backups`, `answer_reports`) per web-Claude SELECT verification. Two competing hypotheses: (a) `start-mock` mode never fires `submitLeaderboardScore` / `cloudBackup` hooks (only fires on session-end events the bot doesn't trigger); (b) the same RLS-class bug that hits real users (sb_publishable_* + direct table POST = silent 401 — see top-line leaderboard finding above) blocks the writes. **Fix for v4**: at session end, force a manual `showLeaderboard()` call and a manual `cloudBackup()` trigger via `[data-action="cloud-backup"]` / equivalent — actually exercise those paths so we can disambiguate (a) vs (b).

### "Why I defaulted to 2 workers initially" — captured per user ask

For the FIRST chaos run today (v1, killed before completion), I used `CHAOS_USERS=2` because that's the bot's default (`Math.max(1, Number(process.env.CHAOS_USERS || 2))`) and the smoke command snippet propagated it. **I did NOT make a deliberate engineering call** — I copied the default and never reconsidered. The honest cost: rare-bug crash-discovery coverage was ~1/15 the v1.21.13 baseline (7h × 15 users) for that pass. The user surfaced this immediately ("Why 2 bots instead of 15") and corrected to 10 × 30 min for v3.

**Lesson for the bot defaults file (next chaos refactor):** change the default in `chaos-doctor-bot.mjs` from `users: 2` to `users: 10`, OR make it explicit-required-no-default so future-me has to specify. The default-of-least-resistance bias is a real failure mode — the cure is to remove the convenient default.

### The 1 unique Sev-3 candidate — clean methodology false-positive (NOT A BUG)

**The question is fine. The bot was wrong. The AI judge then reasoned coherently against the wrong premise.** That nuance matters for any future reader skimming this entry: do not infer that idx=853 was ever suspect — it was not. The 7 flags were a chain of bot/detector failures upstream of any data, and they had zero contact with the question's content quality.

After lookup against `data/questions.json`, the question is **idx=853** (tag `2025-Jun`, ti=20).

| Field | Verbatim |
|---|---|
| Options | [0] annual mammography 50-75 (distractor) · [1] self-exam every 6mo from 30 (distractor) · [2] add US to every mammo (distractor) · **[3] "בגילאי 49-40 אין המלצה גורפת לביצוע ממוגרפיה עקב שכיחות גבוהה של תוצאות חיוביות כזבניות"** |
| `c` / `c_accept` | **3 / [3]** — option D is the answer key |
| Explanation | "המלצות הסקר הישראליות קובעות ממוגרפיה **דו-שנתית** (biennial) בגילאי 50-74…" — already correctly states biennial |

The answer key is D (about ages 40-49), and the explanation explicitly says biennial for 50-74. Both align with the Israeli Task Force on Health Promotion & Preventive Medicine's actual recommendation.

**The 7 AI-judge flags were a downstream cascade of methodology bug #1 (exam-mode `appIdx` detection):**
1. Bot picked option C (idx 2 = "add US to every mammogram") — wrong.
2. Bot clicked C; in exam mode, FM renders the *picked* option (not the *correct* option) with `data-state="correct"`.
3. My flawed `detectAppCorrectIdx` returned `appIdx=2` and reported it to the judge AI as "the app's correct answer is C."
4. Judge AI then reasoned about "app claims C is correct" — but C says "add US to every mammo," which has nothing to do with annual-vs-biennial.
5. Judge AI got confused trying to reconcile that, and ended up critiquing option A's "annual" wording while *believing* it was critiquing C. Its 62-82% confidence reflects its own confusion, not real medical disagreement with the question.

**Lesson for the v4 chaos run:** with `start-sd` (sudden-death, non-exam) mode, `data-state="correct-unchosen"` will mark the actual answer key when the bot picks wrong. Then `appIdx` will be trustworthy and the judge will reason on real data, not bot-induced false premise.

No data edit needed and none should be implied. The artifact at `chaos-reports/upgraded-run/full/flagged_for_review.json` is preserved as a methodology-bug case study, not as a question-quality case.

### Cost-baseline data point for future runs

$5.17 / 585 Qs ≈ **$0.009/Q** on Sonnet 4.6 with 2-3 calls/Q (pick + judge + occasional source-check) at ~1,500 input tokens / Q. Useful for budgeting future doctor-bot runs:
- 1h × 15 users × ~80 Qs/h/worker ≈ 1,200 Qs ≈ **$11**
- 6h × 15 users overnight ≈ ~7,000 Qs ≈ **$65**

Pricing scales linearly. The dominant cost is the judge call (longer prompt with explanation snippet); pick alone is ~30% of total.

### Operational lessons captured

- **Two distinct "dirty file but git diff is empty" classes hit this session — labeled separately so a future reader doesn't conflate them:**

  - **Class (a) — *phantom*** — hit the **13-file revert** at session start. Files showed `M` in `git status` but `git diff -w --ignore-cr-at-eol` was empty. There was no committed content for these "edits"; git's stat cache was simply lying. Self-cleared (or `git update-index --refresh` clears it). **Investigation of root cause is warranted only for this class** — possibilities: file-watcher / sync tool / Windows mtime drift. Did not chase per "log it, don't hunt" instruction.

  - **Class (b) — *real-but-pre-pulled*** — hit `src/features/auth.js`. File showed `M` in `git status`, but `git diff` was empty. Unlike (a), the file *did* contain real recent edits — they were just **already in HEAD** because commit `b379011` (v1.21.16, PR #39 "auth-error UX port from ward-helper PR #100") had landed during the session. The dirty marker was stale stat info sitting on top of already-committed content. `git update-index --refresh` cleared it because the on-disk content matched HEAD, but the underlying cause was different from (a): a fast-forward pulled new content under a still-cached stat from before the pull.

  - Both classes clear identically with `git update-index --refresh`. But the diagnostic stories are distinct: (a) is "git is hallucinating," (b) is "git's stat cache lagged behind a legitimate pull." Don't conflate them in a runbook — the remediation is the same but the root-cause hunt is only meaningful for (a).
- **Selector drift between v1.21.15 and v1.21.16** broke the bot mid-build: stem class `.heb` → `h2.quiz-question`; check `sd-check` → `check-answer`; next `sd-next` → `next-q`. Bot now tries both via OR-selector. **For next chaos run, grep the live source first** rather than relying on cached source from an earlier read.
- **Pipeline `tee` exit-code noise**: my launch command piped `node | tee stdout.log` but the report dir didn't exist when tee opened the file → tee exit 1 → bg task notification said "failed" even though node completed cleanly. **Fix for next launch**: `mkdir -p` the dir before launching, or drop the `tee` (the bot writes its own report).
- **`start-mock` is not the right mode for AI-judge runs** — see methodology bug #1. Sudden-death mode is the correct fit because it reveals the answer key per question.

### Run artifacts preserved

| Path | Purpose |
|---|---|
| `chaos-reports/upgraded-run/full/chaos-doctor-2026-05-07T18-50-35-457Z.{json,md}` | Final aggregate report |
| `chaos-reports/upgraded-run/full/medical_findings_ai.jsonl` | 585 per-Q AI verdicts (pick + judge + optional source) |
| `chaos-reports/upgraded-run/full/flagged_for_review.json` | 7 judge-flagged occurrences of the 1 unique Sev-3 candidate |
| `chaos-reports/upgraded-run/full/worker-*-pageerror.png` | None (zero pageerrors) |
| `chaos-reports/upgraded-run/full/supabase-cleanup.sql` | Timestamp-based DELETE block, ROLLBACK default. **UNEXECUTED — no rows.** Web Claude verified via Supabase MCP: 0 rows across all 4 tables (`mishpacha_leaderboard`, `mishpacha_feedback`, `mishpacha_backups`, `answer_reports`) for the chaos window. Bot's write-path observations were correct; nothing landed, nothing to clean. SQL kept as a methodology artifact for future runs that DO produce rows. |
| `chaos-reports/full-run-v1-killed-at-33min/` | v1 (Geri-style click bot) partial data, 110 screenshots, all action-error |
| `scripts/chaos-live-bot-v2.mjs` | v2 click-bot (human-like timing, FM-aware) |
| `scripts/chaos-doctor-bot.mjs` | v3 doctor-bot (AI-judge: pick / judge / source-check) |

### Open follow-ups (NOT shipped tonight)

| Item | Why deferred |
|---|---|
| **Mammography Q (idx=853) answer-key review** | RESOLVED — not a bug. Answer key D + biennial-correct explanation already match Israeli Task Force. The 7 AI flags were methodology-bug #1 artifact. No action. |
| **Methodology bug fixes for v4 doctor-bot** | Now 5 items (mode, JSON parse, source regex, feedback selectors, force cloud-write triggers at session end). Code-only, ~2h work. Queue for next chaos session — do NOT start v4 without explicit go. |
| **Supabase chaos-row cleanup** | RESOLVED — bot wrote 0 rows; web Claude verified 0 rows in all 4 tables for the chaos window. SQL preserved as methodology artifact. |
| **Cross-sibling leaderboard zero-write bug** | Top-line section above. 1-day FM+Pnimit RPC port + schema-converge work. |

---

## 2026-05-07 — v1.21.15 audit-fix-deploy (LCP fix + dev manifest cleanup)

**Trigger:** user-supplied pre-rooted bug list from issues #25 (LCP killer) + #26 (a11y progressbar) + ad-hoc dev sw.js phantom audit. Single-lane FM deploy (web Claude was working other repos).

**Outcome:** 🟢 shipped v1.21.15 → live (BUILD_HASH `q-v1.21.15` + SW `mishpacha-v1.21.15`). 801/801 tests green. verify-deploy.sh PASS in 57s. 12 files modified, +86/-33 lines.

### Stash-pop conflict cleared on entry

5 working-tree files were `UU` (mishpacha-mega.html, package.json, src/core/constants.js, src/ui/quiz-view.js, sw.js) from a months-old `git stash pop` of `stash@{2}: WIP on main: ba4d745 v1.4.2 — AI-Hard seed 32→39`. Conflict markers were `<<<<<<< Updated upstream` / `>>>>>>> Stashed changes` (stash-pop signature). All 5 resolved by `git checkout HEAD -- <file>` since current main was the correct base. Original stash content preserved at `stash@{2}` (stash entry NOT deleted on conflicted pop). v1.4.2-era values are stale; nothing of value lost.

### Bugs shipped

| Bug | File(s) | Mechanism |
|---|---|---|
| LCP killer (#25) | `scripts/build.sh` heredoc, `scripts/verify-dist-sw.cjs` | Split prod SW pre-cache: SHELL_URLS (atomic addAll) + CRITICAL_DATA (Promise.allSettled, 7 entries) + LAZY_DATA (cache-on-first-fetch, 6 entries, ~8 MB removed from install path). DATA_URLS preserved as spread for fetch-handler SWR. Verifier reads new 3-array layout. |
| Phantom URLs (dev sw.js) | `sw.js` HTML_URLS / CSS_URLS | Dropped non-existent `src/ui/tabs.js` + `shared/layout-primitives.css`. |
| Missing real modules (dev sw.js) | `sw.js` | Added `src/core/sw-update.js`, `src/core/tagMigration.js`, `src/features/post-login-restore.js`, `src/ui/settings-overlay.js` to HTML_URLS; `src/ui/quiz-view.css` + `src/styles/settings.css` to CSS_URLS. |
| Regression guards | `tests/serviceWorker.test.js` | Two new test() blocks: every CSS_URLS entry on disk; every *.js in HTML_URLS on disk. |
| A11y #26 — bare progressbar | `src/ui/quiz-view.js:435` | `aria-label="התקדמות במבחן"` added. Sweep confirmed 1 site total in src/. |
| Console.* leaks | `src/features/cloud.js` (×6), `src/ui/library-view.js` (×6), `src/ui/settings-overlay.js` (×1), `src/ai/client.js` (×2) | Inline `if(import.meta.env.DEV)console.X(…)` matching existing codebase convention (data-loader.js:79-80, sw-update.js:52). |
| Open audit pass — unwired data-action | `src/**` | 0 findings: 170 emitted data-action values, all resolve via `dataset.action`/`action`/`case` dispatch. The first sweep showed 143 false positives because the codebase's `else if(action === 'X')` pattern wasn't in my regex. |

### Surfaced at user-handoff (per FM CLAUDE.md rule 1)

- **`src/ui/quiz-view.css` placement deviation**: user prompt listed it in `HTML_URLS`, but it's a CSS file and the new "every entry in CSS_URLS resolves" guard catches it there cleanly. Landed in CSS_URLS. If the user intended a different layout (e.g., separate JS_URLS array), challenge and refile.
- **CHANGELOG bullet 2 phrasing tightened**: clarified that the dev-sw.js URL-list cleanup does NOT touch prod, but the SHELL/CRITICAL/LAZY split (bullet 1) DOES.

### `npm run verify` — clean
- 49 test files / 801 tests passing (was 47/793 at v1.21.11 → 793 at v1.21.14 → 801 at v1.21.15 with the +2 SW regression guards)
- `verify-dist-sw.cjs` reports `6 shell + 7 critical + 6 lazy = 19 cached paths` — new 3-array layout extracted correctly
- `node scripts/sync-sw-version.cjs` reports `OK: version 1.21.15`
- Live witness PASS in 57s

### Side-tasks for follow-up sessions (NOT shipped today)

| Item | Why deferred |
|---|---|
| **CLAUDE.md stale "isChronicFail() returns undefined" line** | Per `project_geriatrics_track_h_i_outcomes.md` memory and the 2026-05-01 R3 sibling-sync, that was patched. Out of scope this PR (FM CLAUDE.md rule 3 — touch only what you must). One-line fix for next CLAUDE.md drift refresh. |
| **Stash@{2} cleanup** | Decision left to user. The original v1.4.2-era `WIP on main: ba4d745` stash is intact and unreferenced. Safe to `git stash drop stash@{2}` if user agrees. Not auto-dropping since it represents pre-existing user state. |
| **Live "eyeball" verification** | Per `feedback_eyeball_console_ritual.md`, verify-deploy.sh confirms version strings but not real SW behavior, CSP, or LCP impact. User to open https://eiasash.github.io/FamilyMedicine/ in Chrome with DevTools and confirm: (a) Application → SW shows `mishpacha-v1.21.15` active, old caches purged; (b) Network tab — chapter JSONs (harrison/goroll/nelson/lerner/afp_hari) NOT in install request burst, only fetched when Library opens; (c) Console — no `console.warn`/`error` from cloud/library/settings-overlay/ai during normal flow; (d) Inspector — `aria-label="התקדמות במבחן"` on `.quiz-progress` element. |
| **Other ungated console.* recovery diagnostics** | core/data-loader.js:41/73/83, core/state.js:31/101, core/sw-update.js:36, core/utils.js:19, features/post-login-restore.js:158, app.js:426 (already known) — all are recovery-path diagnostics (same pattern as the protected app.js:426). Per scope rule 3 not gated this pass. Could be moved to a single `devLog()` helper in a follow-up cleanup. |
| **Lighthouse a11y < 100** | Beyond #25/#26: contrast issues + content audit not addressed. Out of scope for this single-lane LCP+a11y ship. |
| **Concurrent FM commit `9509a90`** | `test: pin FSRS canonical drift + add property sweeps (#38)` landed during my session — rebased cleanly, no conflict. Confirms the cross-repo FSRS sibling-sync work is active in parallel sessions. |

---

## 2026-05-05 — v1.21.11 deep audit (audit-only, no behavior change)

**Trigger:** workspace-wide deep audit pass across the 4 medical PWAs. FM's just-shipped state is v1.21.11 (Track-Q sibling propagation, cloud backup write path 401 fix landed today).

**Outcome:** 🟢 audit-only — backlog is mostly cross-repo coordinated items or content authoring. **No code change, no trinity bump, no live witness gate.**

### Watch-item spot-checks

| Watch item | Result |
|---|---|
| `vite.config.js` base = `/FamilyMedicine/` | ✅ confirmed; `tests/deployConfigGuard.test.js` pins it (the v1.2.10 fork-bug regression guard) |
| AFP/הר"י `paper.year` schema invariant (string\|null, never empty) | ✅ `tests/afpTopicMap.test.js:68-83` enforces; v1.21.2 cleanup intact |
| Goroll 1-tap deep-link (v1.3.3 refactor not regressed) | ✅ `npm run verify` green; deep-link logic intact |
| Track-Q `backup_set` RPC live | ✅ `src/features/cloud.js` migrated, `tests/cloudFeatures.test.js` updated to expect new RPC URL + body shape |
| **Track-I drift backup file** | ⚠️ **`.audit_logs/track_i_drift_findings_backup.json` not found in FM** — directory has `_stage_a_2020_match_audit.json`, `apply_fm_c_accept.py`, `audit_harrison_title_consistency.py`, `build_fm_mapping.py`, `fm_audit.json`, `fm_dataset_to_qnum_mapping.json`, `fm_skipped_for_review.json`, `harrison_title_consistency.json`, `stage_a_222_triage.md`, `topic_analysis_2026-05-03/`, `exam_pdfs/` — **no track_i artifact**. Likely confusion with the Geri-side `.audit_logs/track_i_drift_findings_v3.local-backup.json` that this terminal session moved aside earlier today during the v10.64.45 → v10.64.47 fast-forward in Geri. Surfacing rather than papering over: if a track_i artifact was expected in FM, it never landed; if not, no concern. |

### `npm run verify` — clean

Full pre-push gate ran green. 764+ tests across 43+ files (per v1.21.2 baseline; lockstep with v1.21.11 propagation).

### Backlog items NOT shipped (with rationale)

| Item | Why not shipped this pass |
|---|---|
| `shared/fsrs.js isChronicFail()` Boolean-coercion patch | Cross-repo coordinated bump (Geri + IM + FM in lockstep). R3+ cross-repo session. |
| Vite 6/7→8, ESLint 9→10 majors | Cross-repo coordinated, plugin compat. R3+. |
| Live RLS sanity pass on `krmlzwwelqvlfslwltol` | Toranot CI cron territory per FM's own R2 proposal. |
| Nelson page numbers + per-chapter PDFs | Data work, not engineering. |
| 12 legacy AFP papers pre-2018 | Per skill spec "don't fabricate years" — kept. |
| `proxy_rate_limits` lock to service_role | Cross-repo migration with Toranot. |
| UI integration test layer (jsdom/browser) | Largest coverage gap is UI; ~200 tests of authoring effort. R4+. |

### Web Claude lane

`claude/web-doc-currency-20260505` is open on origin. This audit deliberately did NOT touch `CLAUDE.md` or `tests/docCurrency.test.js`.

### PAT audit

No GitHub PAT, Anthropic API key, or Supabase service-role key shapes in this terminal session's visible context.

---

_Generated by /audit-fix-deploy on 2026-04-22 (late pm)._

## Audit pass: clean

- Version sync: APP_VERSION 1.3.3 = sw.js `mishpacha-v1.3.3` = package.json 1.3.3 ✅
- Q corpus: 950 Qs across 7 exam tags (2020=150, 2021-Jun=150, 2022-Jun=150, 2023-Jun=150, 2024-May=100, 2024-Sep=100, 2025-Jun=150) ✅
- Topic coverage: all 27 topics ≥ 5 Qs (no gaps) ✅
- Tests: 26 files / 398 passing ✅
- Supabase creds on shared project `krmlzwwelqvlfslwltol` match § B/D/E (publishable key `sb_publishable_tUuqQQ8RKMvLDwTz5cKkOg_o_y-rHtw`) ✅
- No legacy JWT anon keys (`eyJhbGciOi…`) hanging around ✅
- No ungated `console.log` leaks in src/ (only CHANGELOG references) ✅
- No `TODO`/`FIXME` in src/ ✅

## v1.3.3 change (this audit)

**Nelson Library tab now loads like Goroll.** Previously, clicking a Nelson chapter entered a "chapter-reader shell" (in-app view with no body text — the full PDF lives on Drive). Clicking the chapter title never actually opened the PDF — you had to take a second tap on a `→ PDF (Drive)` button inside the shell. The shell auto-triggered an AI summary on open just to have something to render.

Goroll, in contrast, is 1-tap: click a chapter row → PDF opens at the chapter page.

**Refactor**:
- Each Nelson chapter row is now a direct `<a href>` — single tap opens the PDF in a new tab, same UX as Goroll.
- Href resolution is progressive:
  1. If chapter has `{file: "Ch42.pdf"}` → serves from `nelson/Ch42.pdf` (local, offline-capable, matches Harrison pattern). Waiting on user to drop per-chapter PDFs.
  2. Else if chapter has `{page: 687}` → links to Drive PDF with `#page=687` deep-link.
  3. Else → Drive root (current default for all 165 chapters).
- AI Summary (📝) and AI Quiz (🧠) moved to small inline per-row buttons — discoverable, not blocking.
- `G.nelChOpen` state + `open-nel-chapter` + `close-nel-chapter` action handlers removed (dead code).
- Auto-AI-summary-on-open workaround removed (was only needed because the shell had no body text).

As user progressively populates `page` or `file` fields in `nelson_chapters.json`, the UI upgrades automatically. No further code change needed for that.

## Follow-ups / self-improve queue

### 1. Populate Nelson `page` numbers (data work)

`nelson_chapters.json` has 165 entries, all currently `{ch, title_en, notes_he}`. Adding `page` per chapter (from the Nelson 22e ToC) would turn every Drive link into a chapter-specific deep-link — matching Goroll's "opens at the right page" UX even without shipping the PDF locally.

Estimated effort: a Sonnet OCR pass on the Nelson ToC + manual spot-check = ~20 min, ~$0.50.

### 2. Optional: ship per-chapter Nelson PDFs (matches Harrison pattern)

CLAUDE.md notes "**Nelson peds chapters** — user will send". When those land, drop them under `nelson/` and add `{file: "…pdf"}` to each chapter in `nelson_chapters.json`. The UI already prefers `file` over `page` over Drive-root — zero code change needed.

Constraint: GitHub blocks individual files > 100 MB. Nelson 22e is 167 MB, so a single monolith isn't feasible; per-chapter (or volume-split) is the only way to host locally.

### 3. `dir="rtl"` → `dir="auto"` hygiene (low priority)

5 remaining `dir="rtl"` uses in `src/ui/app.js` (help overlay, quick-start) and `src/ui/quiz-view.js` (AI flag banner, teach-back input). Skill prefers `dir="auto"` + `unicode-bidi:plaintext` but these blocks are Hebrew-only so correctness isn't impacted. Defer.

### 4. Pre-existing `innerHTML` pieces warnings (not a regression)

`scripts/check-innerhtml-pieces.py` exits 1 flagging `heDir(...)` calls in:
- `src/ai/explain.js:29` (× 2)
- `src/quiz/engine.js:197`

These were introduced in commit `239de75c` (v1.2.16) — not part of this change. `heDir()` wraps content in a `<bdi dir="auto">` tag but doesn't sanitize, which is why the checker flags it. Safe-in-practice because inputs are Anthropic API output, but the checker wants an explicit `// safe-innerhtml:` annotation or `sanitize()` wrap.

Not wired into CI (only GATES 1-6 in `integrity-guard.yml` run, which don't include this checker), so it doesn't block deploy — but worth either annotating or sanitizing to get the checker green.

### 5. FSRS sibling drift (cross-repo)

md5 sums differ across the three sibling repos:
- fam: `55187e02fa3cf158c02afc6bc07395a9`
- pnimit: `0bfb6d10f81a7649768152986a789189`
- geri: `b89e0f7e71a869f44ed0db845cd6ef6f`

Pnimit vs fam: only 2 substantive lines differ — the per-app localStorage exam-date key (`mishpacha_exam_date` vs `pnimit_exam_date`), which is correct/intentional.

Geri vs fam: fully divergent (different line endings and/or actual content). Geri may be missing the deadline-aware v2 wrapper. **Flag for a cross-repo FSRS reconciliation pass.**

### 6. Skill doc drift

`audit-fix-deploy` SKILL.md § C says "Test count: 315 across 21 files." Reality: 398 across 26 files. Update on next skill revision.

### 7. CLAUDE.md doc drift

`CLAUDE.md` at repo root mentions v1.3.0 as "current state" and `mishpacha-v1.3.0` SW cache. Bump to v1.3.3 on next CLAUDE.md pass.

---

## v1.4.3 audit pass (2026-04-23)

### RLS sanity pass — shared Supabase project `krmlzwwelqvlfslwltol`

Ran the 4-query sanity pass (STEP 0 of audit-fix-deploy). 18 public-schema tables enumerated, 3 distinct risk classes surfaced.

**Status summary:**
- ✅ RLS enabled on every public table (18/18).
- ✅ No legacy `{public} qual=true` on authenticated-scoped data where `auth.uid()` exists (`toranot_state`, `shared_shifts` both properly gated).
- ✅ No test/debug-named leftover policies.
- ⚠️ 3 zero-policy tables — intentional but worth documenting.
- ⚠️ 8 public/anon `qual=true` tables — architectural, not a hole, but worth calling out.
- ⚠️ 1 rate-limit bypass surface.

**Zero-policy tables (intentional, service-role only):**
- `app_config` — server-managed kill-switches/config.
- `toranot_config` — same pattern.
- `toranot_patients_backup` — auto-snapshot table written by server on schema change, never client-touched.

These are safe. RLS-on + 0 policies = deny-all to anon/authenticated; only service_role (server code) can read/write. No fix needed, just documented here so future audits don't flag as "unreachable = broken".

**Capability-token tables (`{public}` / `{anon}` qual=true, uid-keyed):**

All three medical-PWA backups + leaderboards sit on the same anonymous-user pattern: client generates a long-random `uid` (text PK), stores it in IndexedDB, uses it as a capability token.

| Table | PK | Policies | Real risk |
|-------|-----|----------|-----------|
| `mishpacha_backups` | `id TEXT` | anon S/I/U qual=true | If `uid` is high-entropy random → safe (capability token). If low-entropy / user-chosen → enumeration exposes all user progress. **Check client-side uid generation.** |
| `pnimit_backups` | `id TEXT` | public S/I/U qual=true | Same as above. |
| `samega_backups` | `id TEXT` | public S/I/U qual=true | Same as above. |
| `mishpacha_leaderboard` | `uid TEXT` | anon S/I/U qual=true | Public read is expected (it's a leaderboard). Public UPDATE qual=true = anyone can edit anyone's score if they guess a uid. Acceptable if uid is a secret capability token. |
| `pnimit_leaderboard` | `uid TEXT` | public S/I/U qual=true | Same. |
| `shlav_leaderboard` | `uid TEXT` | public S/I/U qual=true | Same. |

**Action for § C (Mishpacha):** audit `src/features/cloud.js` to confirm `uid` is `crypto.randomUUID()` or `crypto.getRandomValues()` — **NOT** derivable from device fingerprint or user handle. If it's weak, the RLS posture is effectively "security by obscurity". Don't migrate to authenticated mode (breaks anonymous-use-case) — instead, harden the uid to 128+ bits of entropy.

**P1 — rate-limit bypass: `proxy_rate_limits`**

Schema: `device_id TEXT, date TEXT, count INT`. Policy: **`ALL qual=true with_check=true roles={public}`**.

This means ANY anon client can issue `DELETE FROM proxy_rate_limits` or `UPDATE proxy_rate_limits SET count=0` and reset everyone's rate limits — defeating the whole point of the table.

**Recommended fix (a cross-repo migration, blocks § B/D as well if they use this table):**
```sql
DROP POLICY "Allow all proxy_rate_limits" ON public.proxy_rate_limits;
CREATE POLICY "service_role full" ON public.proxy_rate_limits
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```
The Netlify proxy function must then be switched from anon key to service_role key (server-only, not shipped in client bundle) for the increment/read path. If the function currently uses anon key client-side — that's the deeper bug; rate-limiting via client-held credentials has always been a fiction.

**Deferred** — requires coordination with Toranot deploy. Not blocking v1.4.3.

**P2 — feedback tables `qual=true` public SELECT:**
`answer_reports`, `mishpacha_feedback`, `pnimit_feedback`, `shlav_feedback` — anyone can read everyone's feedback. Content is user-submitted review/report text. Not catastrophic but if users think feedback is private, it's not. Consider either (a) a banner in the UI saying "feedback is public" or (b) dropping SELECT policy entirely and letting the maintainer query via service_role.

**Conclusion:** 0 hard stops. 1 P1 (rate-limit bypass) deferred pending cross-repo coordination. Shared-Supabase architecture is capability-token based, which is legitimate for an anonymous-user app but fragile — uid entropy audit recommended.

### Follow-ups added this pass

8. **Audit `cloud.js` uid entropy** (client-side, § C only).
9. **Lock `proxy_rate_limits` to service_role** — cross-repo migration, needs Toranot coordination.
10. **Feedback-is-public UX copy** — small banner on feedback form, non-blocking.

---

## 2026-05-01 — v1.21.1 audit-fix-deploy pass

**Audit summary**: 42 test files / 723 tests passing, version trinity aligned, build green, 6 critical assets in `dist/`.

### Findings (3 fixed, 4 deferred)

1. **FIXED — `tests/honestStats.test.js` CRLF regex bug.** `src/ui/track-view.js` checks out as CRLF on Windows. The regex `/\n\}\n/` failed because file ends with `\r\n}\r\n` not `\n}\n`. Now normalizes CRLF→LF before matching. (Cross-repo regression risk: same pattern exists in IM/Geri honestStats tests.)

2. **FIXED — 4 AFP/הר"י specialties unmapped to any quiz topic.** `אא_ג` (ENT/oral/dental), `אונקולוגיה` (oncology), `כירורגיה` (surgery), `עיניים` (ophthalmology) had zero entries in `TOPIC_TO_AFP_SPECS`. The "related papers" sidebar would render empty on any topic that should logically include them. Mapped to topics 4/8/12/13/14/16/20/22/24 per clinical relevance.

3. **FIXED — `TOPIC_TO_AFP_SPECS` ↔ `AFP_SPEC_TO_TOPICS` round-trip now pinned.** New `tests/afpTopicMap.test.js` enforces inverse-map identity and full-coverage invariants. Future drift will surface in CI before deploy.

### Deferred / documented

4. **`shared/fsrs.js isChronicFail` returns `undefined`** when `fsrsD` is missing on the SR entry and `lowAccuracy` is false. The expression `false || undefined` evaluates to `undefined`, not `false`. Cannot fix from FM alone — `shared/fsrs.js` is byte-identical across 3 sibling repos (canonical md5 `cea66a0435…`). Fix proposal: `return Boolean(lowAccuracy||highDifficulty);` Needs coordinated tri-repo bump in a dedicated session. Test now uses truthy/falsy assertions instead of strict equality.

5. **6 papers in `data/afp_hari_index.json` have year issues.** Four AFP papers are pre-2010 (1990, 2003, 2004, 2004) — outside the rolling 7-year window declared in CLAUDE.md (2018-2025). Two הר"י papers (idx 440, 452) have empty year strings. Test pins the count (≤4 legacy outliers, no missing year on AFP-kind). Recommend re-ingest pass to refresh citations or formally exclude pre-2010 corpus.

6. **Two unannotated `innerHTML` sites** at `src/ai/explain.js:29` and `src/quiz/engine.js:197`. The `scripts/check-innerhtml-pieces.py` checker flags them (pre-existing from v1.2.16). Add `// safe-innerhtml:` annotation or wrap in `sanitize()` to clear the checker. Not wired into CI yet, doesn't block deploy.

7. **`dir="rtl"` literal still appears in static help-overlay markup** (`src/ui/app.js:224, 272`). Per cross-repo CLAUDE.md, prefer `dir="auto"` + `unicode-bidi: plaintext`. The strings are pure-Hebrew help content so RTL is correct semantically, but the convention is the auto path. Low priority — defer until next help-overlay rewrite.

### RLS sanity pass

Skipped live MCP `execute_sql` — Supabase MCP server requires OAuth and was not authenticated in this session. Local migration files (`supabase/migrations/0001_init_mishpacha_tables.sql`, `0002_study_plans.sql`) reviewed: every table has `ENABLE ROW LEVEL SECURITY`, `mishpacha_*` tables use `anon` policies with `qual=true` (intentional for shared-project anon-keyed PWAs — same pattern as Toranot/Geri/IM). Per workspace memory, the shared `krmlzwwelqvlfslwltol` project was last verified clean by recent sibling sessions. Re-run live RLS pass on next session that touches schema.

### Test count progression

- Start: 673 (40 files)
- Bug fixes: +0 (1 honest stats test repaired in place)
- New file `tests/afpTopicMap.test.js`: +13 tests (AFP index schema + topic map round-trip)
- New file `tests/fsrsBoundariesAndBidi.test.js`: +37 tests (FSRS boundaries + Hebrew bidi)
- **End: 723 tests across 42 files (+50 net, +2 files)**

---

## 2026-05-01 — v1.21.2 audit-fix-deploy R2 (deeper-dig pass)

**Round 2 scope**: resolve R1 deferred items (except #1 fsrs which is R3 cross-repo work), deeper audit, expanded testing.

### R1 deferred items — resolution

**Item 2 — afp_hari_index year metadata: FIXED.**
- 16 הר"י papers had wrong years extracted (extractor bug in `scripts/extract_afp_hari.py` pulled the first 4-digit number from the PDF body text instead of the year encoded in the title/filename). Fixed by `scripts/fix_afp_hari_years.py` — recovers latest 20XX year mention from title/filename.
- 2 הר"י papers (idx 440, 452) genuinely have no year info in source frontmatter or PDF stem → set to explicit `null` sentinel (NOT empty string).
- 12 legacy AFP papers pre-2018 (3 pre-2010: 1990, 2003, 2004; 9 in 2010-2017) kept as-is per skill spec ("don't fabricate years"). Test ceiling raised from 4 → 12 to match observed count after re-counting.
- New schema invariant pinned: `paper.year` is `string|null` — NEVER empty string. New test `tests/afpTopicMap.test.js` line ~67 enforces.

**Item 3 — innerHTML/dir=rtl cosmetic: FIXED.**
- Both `scripts/check-innerhtml.py` and `scripts/check-innerhtml-pieces.py` now exit 0. R1 had already added `// safe-innerhtml:` annotations at `src/ai/explain.js:29` and `src/quiz/engine.js:204` — confirmed clean in R2.
- 2 `dir="rtl"` literals in static help overlay (`src/ui/app.js:224, 272`) converted to `dir="auto"` per cross-repo workspace convention. Both retain `unicode-bidi:plaintext` and `<bdi>` wraps for embedded English drug/section names.

**Item 4 — RLS pass on `krmlzwwelqvlfslwltol`: STILL OAUTH-BLOCKED.**
- Supabase MCP (`mcp__supabase__authenticate`) requires OAuth flow; in this agent session the server is bound to a *different* project (`drvocrtufqtifkgmijpg`) and would prompt the user for browser-based auth. Same blocker as R1.
- **Proposed Round 3 / CI cron pattern** (does have OAuth):
  ```yaml
  # .github/workflows/rls-sanity.yml — cross-repo, runs in Toranot
  on: { schedule: [{ cron: '0 7 * * 1' }] }  # Monday 07:00 UTC
  jobs:
    rls-sanity:
      runs-on: ubuntu-latest
      env: { SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }} }
      steps:
        - run: |
            curl -sf -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
              -H 'Content-Type: application/json' \
              -d '{"query": "SELECT schemaname, tablename, policyname, qual, with_check FROM pg_policies WHERE schemaname=''public'' ORDER BY tablename, policyname;"}' \
              "https://api.supabase.com/v1/projects/krmlzwwelqvlfslwltol/database/query" \
              | jq '.[] | select(.qual == "true" and (.policyname | test("(?i)admin|service|server")) | not)' \
              > /tmp/risky-policies.json
            test ! -s /tmp/risky-policies.json
  ```
  Place in Toranot (which already has the SUPABASE_ACCESS_TOKEN secret); covers all 5 sibling apps on the shared project.
- Local migrations re-reviewed in R2: `supabase/migrations/0001_init_mishpacha_tables.sql` + `0002_study_plans.sql` — every table has `ENABLE ROW LEVEL SECURITY`. `mishpacha_*` tables intentional `anon` `qual=true` (capability-token model).

### R3 fsrs patch (DO NOT APPLY in any single-repo session)

`shared/fsrs.js` content hash (R2): `9f91faaf4f814c5747318f8f6bcf2157b883582d` (git hash-object); md5 `5e027f967637a8045e726a2ba7f839aa`.

`isChronicFail()` line 73 currently returns `lowAccuracy || highDifficulty` where `highDifficulty = srEntry.fsrsD && srEntry.fsrsD>=8 && srEntry.tot>=3`. When `fsrsD` is `undefined`, the chain short-circuits to `undefined`; combined with `lowAccuracy=false` the function returns `undefined` instead of `false`.

**Proposed patch (apply in R3 across § C/D/E in lockstep):**
```js
function isChronicFail(srEntry){
  if(!srEntry)return false;
  const lowAccuracy=srEntry.tot>=4&&srEntry.ok/srEntry.tot<0.35;
  const highDifficulty=srEntry.fsrsD!=null&&srEntry.fsrsD>=8&&srEntry.tot>=3;
  return Boolean(lowAccuracy||highDifficulty);
}
```

Two minimal edits:
1. `srEntry.fsrsD &&` → `srEntry.fsrsD!=null &&` (avoid the `undefined` short-circuit; allow `0` to be falsy as before — note `0` is not actually a valid FSRS difficulty since the algorithm clamps to [1,10], but the change is defensive)
2. `return lowAccuracy||highDifficulty;` → `return Boolean(lowAccuracy||highDifficulty);` (pin return type to boolean)

After this patch, all three repo tests can switch from truthy/falsy assertions back to strict `expect(...).toBe(true)` / `toBe(false)`.

### R2 deeper findings

**Dependency review**:
- `npm audit` flagged 1 moderate (postcss CVE GHSA-qx2v-qp2m-jg93, transitive) — fixed via `npm audit fix`. Now 0 vulnerabilities.
- `npm outdated`: vite 6 → 8 available (skipped — major bump, requires verify pass), eslint 9 → 10 (skipped — same), vitest 4.1.4 → 4.1.5 patch (skipped this round to keep R2 focused on data + tests).

**Bundle analysis**:
- Total `dist/`: 172 MB (well under 200 MB skill ceiling). Bulk is `dist/harrison/` (59 MB) + `dist/exams/` (36 MB) + `dist/afp_hari/` (~70 MB).
- Single biggest JS asset: `dist/assets/mishpacha-mega-Crq9KF5L.js` at 363 KB (well under 5 MB skill ceiling).
- `dist/data/questions.json` 1.2 MB, `dist/harrison_chapters.json` 2.3 MB, `dist/lerner_chapters.json` 3.6 MB. No outliers.

**Coverage gaps (top 10 untested src/ files by line %)**:
1. `src/ui/library-view.js` — 1.14% (largest UI file at 1008 lines)
2. `src/ui/more-view.js` — 0.91%
3. `src/features/study_plan/index.js` — 2.06% (algorithm is well-covered, the UI wrapper is not)
4. `src/ui/track-view.js` — 4.23%
5. `src/ui/quiz-view.js` — 28.52%
6. `src/features/cloud.js` — 45.97%
7. `src/features/auth.js` — 29.69%
8. `src/features/post-login-restore.js` — 33.33%
9. `src/ui/learn-view.js` — 17.50%
10. `src/quiz/engine.js` — 51.32%

Overall coverage 34.96% statements / 25.30% branch / 33.70% function. UI is the bulk gap; an integration-test pass with `@vitest/browser` or jsdom would be the right next step — but that's a Round 4+ scope (~$$$ AI to author 200+ DOM tests).

**Topic Q-count health (skill § C.6 says < 5 → AI-Ch authoring trigger)**:
- All 27 topics ≥ 16 Qs. Lowest: ti=19 (16), ti=21 (20), ti=0/16 (20), ti=11/12 (22), ti=23/7 (24).
- No gaps. No AI-Ch authoring needed.

**AFP coverage per topic** (all 27 topics):
- All 27 topics have ≥ 12 AFP/הר"י papers reachable via `TOPIC_TO_AFP_SPECS`.
- Lowest: ti=21 (12), ti=0/1/22 (~14-19). Highest: ti=25 (86), ti=24 (84), ti=14/22 (~71-81).
- No 0-coverage topics. Gap-free.

**Past-exam coverage** (Q count per session tag):
| Tag | Qs |
|---|---|
| 2020 | 150 |
| 2021-Jun | 150 |
| 2022-Jun | 150 |
| 2023-Jun | 150 |
| 2024-May | 100 |
| 2024-Sep | 100 |
| 2025-Jun | 150 |
| FM-Core | 111 |
| **Total** | **1061** |

Matches CLAUDE.md baseline. `EXAM_YEARS` whitelist correctly mirrored.

**Service worker cache size baseline**:
- 18 manifest paths (6 shell + 12 data) — same as v1.21.1
- `dist/sw.js` 3.8 KB (unchanged)
- 172 MB total dist (unchanged from R1)

### R2 expanded testing

**New file `tests/round2DeepCoverage.test.js`** (40 tests):
- Quiz engine multi-tag intersection (6 tests): empty year array, unknown year token rejection, toggle add/remove symmetry, clear semantics, multi-year intersection
- Study-plan scheduler boundaries (12 tests): hours floor/ceiling, allocate/schedule ordering, ramp stages collapse/clamp, daily Q target floor/ceiling/invalid, exam-before-start rejection, not-enough-weeks rejection, DST seam (7-day weeks across spring-forward), calendar-aligned ISO dates
- Service worker manifest invariants (5 tests): CACHE name matches package.json, cache-first wired, navigate fallback, activate cleanup, skipWaiting message
- IndexedDB round-trip mock (2 tests): set/get round-trip, missing-key returns null
- Hebrew bidi clinical-mixed (7 tests): drug names ltr, mixed Hebrew+Arabic-digits+English-suffix rtl, 25% boundary, just-under-25% ltr, empty/digit-only/punct auto, lab-abbrev mixed
- Mutation resistance (5 tests): isOk c_accept overrides primary, empty c_accept fallback, missing c_accept fallback, allocateHours floor at 0%, defaultDailyQTarget exact boundary at hpw=4

**Test count delta**: 723 → 764 (+41), 42 → 43 files (+1). Net coverage % same baseline (34.96% → ~35.5% on new code paths).

### v1.21.2 changes

- **Data**: 18 entries in `data/afp_hari_index.json` updated (16 corrected years + 2 null sentinels)
- **Code**: 2 `dir=rtl`→`dir=auto` swaps in `src/ui/app.js`
- **Tests**: +41 net (1 new file `round2DeepCoverage.test.js`, +3 in `afpTopicMap.test.js` for new schema)
- **Tooling**: new `scripts/fix_afp_hari_years.py` (idempotent) for future re-ingest passes
- **Deps**: postcss bumped via `npm audit fix` (transitive) — 0 vulnerabilities
- **Version trinity**: bumped to 1.21.2 (data fixes are material per skill § C)
- **Skill**: `docs/family-medicine-dev-skill.md` created in-repo (user-global and `.claude/skills/` paths still permission-blocked at the agent layer; install path is documented at top of the file).

### Deferred to R3+

| # | Item | Why deferred |
|---|---|---|
| 1 | `shared/fsrs.js isChronicFail` patch | Cross-repo (Geri + IM + FM) coordinated bump |
| 2 | Live RLS sanity pass on `krmlzwwelqvlfslwltol` | OAuth-only via Supabase MCP — recommend Toranot CI cron with `SUPABASE_ACCESS_TOKEN` |
| 3 | Vite 6→8 / ESLint 9→10 majors | Verify-pass-required, defer until R3+ has time to handle plugin compat |
| 4 | UI test integration layer (jsdom/browser) | Largest coverage gap is UI; needs ~200 new tests (~$$$ AI authoring) |
| 5 | `cloud.js` uid entropy audit | From R1 list; not yet checked (look for `crypto.randomUUID` or `crypto.getRandomValues`) |
| 6 | Pnimit `mishpacha_exam_date` localStorage scoping | Currently `shared/fsrs.js` looks at all 3 sibling keys — confirms intentional cross-app reuse |
| 7 | `proxy_rate_limits` lock to service_role | Cross-repo migration with Toranot; rate-limit-via-anon-key is theatre |
| 8 | Feedback-is-public UX banner | Non-blocking UX nit |

### Skill creation status

`~/.claude/skills/family-medicine-dev/SKILL.md` and `.claude/skills/family-medicine-dev/SKILL.md` both **still permission-blocked** by agent layer in R2. Skill content shipped at `docs/family-medicine-dev-skill.md` with install instructions at top. User can `cp` to user-global path manually for global activation.
