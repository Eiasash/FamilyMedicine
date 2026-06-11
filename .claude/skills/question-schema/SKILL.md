---
name: question-schema
description: Authoritative schema reference for data/questions.json, data/highyield.json, data/notes.json, data/nelson_notes.json, and data/drugs.json in the Family Medicine (Mishpacha Mega) app. Claude must load this whenever editing any of those files. Contains exact field names, allowed values, the c_accept invariant, the 27-topic map, and the tag whitelist. Complements the /add-questions command — doesn't replace it.
---

# Data Schema — Mishpacha Mega (Family Medicine Shlav A)

When editing the data files below, follow this schema exactly. Field names are compact. Do not invent verbose aliases. The CI workflows (`.github/workflows/ci.yml`, `integrity-guard.yml`) enforce most of this — read them if in doubt.

## questions.json — array of objects

| Field | Type | Allowed | Notes |
|---|---|---|---|
| `q` | string | Hebrew (or English) | Question stem. Preserve literal line breaks and RTL punctuation. |
| `o` | array | **exactly 4 strings** | MCQ options in Hebrew. No letter prefixes ("A)" / "א)"). No markdown. |
| `c` | integer | 0..3 | Index into `o` of the correct answer. CI requires `0 <= c < len(o)`. |
| `c_accept` | array | option indices | Accepted answers. **Primary `c` MUST be a member.** Non-empty, no duplicates, every index in range. Optional, but when present the CI gate enforces all of this. |
| `t` | **string** | whitelisted tag | Source/session tag (see whitelist below). NEVER an integer. |
| `st` | string | sub-topic label | Optional free-form short label. |
| `ti` | integer | **0..26** | Topic index per the 27-topic map below. |
| `e` | string | explanation | Optional explanation text. |

**Not on the question:** there is NO `id`, `source`, `year` (numeric), `correct`, `options`, `topic`, or `text` field. The quiz engine uses the 0-based array index as the canonical question ID.

## highyield.json — separate array (AI high-yield items)

Same shape as `questions.json` **plus** a `ref` field (citation string). These are AI-generated (tag `t='AI-2026-hy'`), kept in a separate file so they never silently merge into the main bank. AI keys are never auto-merged — see `/add-questions`.

| Field | Notes |
|---|---|
| (all of `questions.json` above) | same rules, incl. the `c_accept` invariant |
| `ref` | source citation — Goroll / Nelson / AFP / MOH-הר"י |

## notes.json / nelson_notes.json — study notes

Read the file before editing to learn its exact field layout (do not assume keys). Split by audience:
- `notes.json` — adult primary-care notes, sourced from Goroll 8e / AFP / MOH-הר"י.
- `nelson_notes.json` — pediatric notes, sourced from Nelson 22e.

Dense, board-pearl style. Cite the source accurately; never reference a source outside Goroll / Nelson / AFP / MOH-הר"י.

## drugs.json — array of objects

Read the file to confirm its current fields before editing; keep field names stable (do not rename). Use INN (generic) drug names with the Israeli brand in parentheses where useful.

## Tag whitelist (`t`)

The set lives in `.github/workflows/ci.yml` and grows over time — read it for the current list. As of authoring it is:

```
2020, 2021-Jun, 2022-Jun, 2023-Jun, 2024-May, 2024-Sep, 2025-Jun,
Goroll, Nelson, AFP, Exam, FM-Core, AI-2026, AI-2026b
```

(High-yield generation also uses `AI-2026-hy` for `highyield.json` items.) Any `t` not in the current whitelist fails CI.

## 27-topic map (`ti` → topic name)

Source of truth is `TOPICS[27]` in `src/core/constants.js` (syllabus P0062-2025). Order follows clinical-workflow clustering (adult → age-group → cross-cutting):

```
 0  Adult Cardiology — IHD & Arrhythmia
 1  Heart Failure & Valves
 2  Hypertension & Lipids
 3  Pulmonology (Asthma, COPD, PE)
 4  Gastroenterology & Hepatology
 5  Nephrology, UTI & Urology
 6  Endocrinology — Diabetes
 7  Endocrinology — Thyroid & Other
 8  Hematology & Coagulation
 9  Rheumatology & Musculoskeletal
10  Neurology (Stroke, Headache, Dementia)
11  Dermatology
12  Allergy & Immunology
13  Infectious Disease & Vaccines (Adult)
14  Women's Health & Gynecology
15  Pregnancy, Perinatal & Postpartum
16  Men's Health
17  Geriatrics (Falls, Cognition, Polypharmacy)
18  Mental Health — Mood, Anxiety, Psychosis
19  Addictions & Lifestyle Behaviors
20  Preventive Medicine & Health Promotion
21  Pain, Palliative & End-of-Life
22  Emergencies in the Clinic
23  Peds — Newborn & Development
24  Peds — Acute & Infections
25  Peds — Adolescent & Mental Health
26  EBM, Communication & Family Systems
```

Parallel arrays `IMA_WEIGHTS[27]` and `EXAM_FREQ[27]` (same file) give per-topic exam weight and historical frequency — use them to prioritise generation/explanation, not to validate.

## Rules when editing

1. **Never change field names.** CI and the corpus manifest key on them.
2. **Preserve ordering in `questions.json`.** Insert at the end unless explicitly asked to reorder — array indices are canonical IDs.
3. **`t` is a string** and must be whitelisted. `"t": 2024` (integer) is invalid.
4. **`c` must be 0..3** and must satisfy `c ∈ c_accept` when `c_accept` is present.
5. **Exactly 4 options in `o`.** Not 3, not 5. Never.
6. **`ti` in 0..26.** 27+ breaks the topic filter and analytics.
7. **AI items go in `highyield.json`,** not `questions.json`, and never auto-merge.
8. **Hebrew RTL.** Preserve original whitespace and punctuation. Don't NFC-normalise without checking — it can change IME rendering.

## Duplicate detection

CI rejects *conflicting* duplicates (same first-80-chars stem + identical `o` but different `c`). When adding a question, grep a ~30-char unique substring of the stem against `data/questions.json` first.
