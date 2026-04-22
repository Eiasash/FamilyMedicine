# AFP & הר"י — Shlav A reading list (filtered)

Extracted summaries for papers on the **רשימת ספרות מחייבת** for שלב א' רפואת משפחה 2026.

**Syllabus window:** 2018-06 → 2025-05 (7-year rolling window ending 12 months before the 2026 exam, per the ועדת הבחינות ברפואת המשפחה required-reading PDF).

**Totals:** 473 AFP review articles · 69 הר"י guidelines across 23 specialties.

Each paper has:

- A **committed `.md` summary** (title, citation, abstract, SORT / key recommendations, opening paragraphs)
- A **raw `.txt` dump** in `.raw/` (gitignored — rebuild locally with `python3 scripts/extract_afp_hari.py`)
- A link back to the source PDF

## Specialties

- [אא_ג, רפואת הפה והשיניים](אא_ג, רפואת הפה והשיניים/index.md) — 19 AFP · 0 הר"י
- [אונקולוגיה](אונקולוגיה/index.md) — 10 AFP · 0 הר"י
- [אורולוגיה](אורולוגיה/index.md) — 15 AFP · 1 הר"י
- [אורתופדיה](אורתופדיה/index.md) — 33 AFP · 0 הר"י
- [אנדוקרינולוגיה](אנדוקרינולוגיה/index.md) — 18 AFP · 1 הר"י
- [גסטרואנטרולוגיה](גסטרואנטרולוגיה/index.md) — 23 AFP · 5 הר"י
- [המטולוגיה](המטולוגיה/index.md) — 12 AFP · 0 הר"י
- [כאב](כאב/index.md) — 10 AFP · 2 הר"י
- [כירורגיה](כירורגיה/index.md) — 12 AFP · 0 הר"י
- [מחלות זיהומיות](מחלות זיהומיות/index.md) — 35 AFP · 2 הר"י
- [נוירולוגיה](נוירולוגיה/index.md) — 26 AFP · 4 הר"י
- [נפרולוגיה, אלקטרוליטים ולחץ-דם](נפרולוגיה, אלקטרוליטים ולחץ-דם/index.md) — 10 AFP · 2 הר"י
- [סוגיות ותסמינים כלליים](סוגיות ותסמינים כלליים/index.md) — 32 AFP · 4 הר"י
- [עור](עור/index.md) — 23 AFP · 4 הר"י
- [עיניים](עיניים/index.md) — 4 AFP · 0 הר"י
- [פסיכיאטריה](פסיכיאטריה/index.md) — 21 AFP · 0 הר"י
- [קידום בריאות ורפואה מונעת](קידום בריאות ורפואה מונעת/index.md) — 23 AFP · 1 הר"י
- [קרדיולוגיה](קרדיולוגיה/index.md) — 12 AFP · 2 הר"י
- [ראומטולוגיה](ראומטולוגיה/index.md) — 9 AFP · 0 הר"י
- [ריאות](ריאות/index.md) — 16 AFP · 0 הר"י
- [רפואת ילדים](רפואת ילדים/index.md) — 45 AFP · 20 הר"י
- [רפואת נשים](רפואת נשים/index.md) — 50 AFP · 21 הר"י
- [תרופות, פרמקולוגיה וטוקסיקולוגיה](תרופות, פרמקולוגיה וטוקסיקולוגיה/index.md) — 15 AFP · 0 הר"י

## Re-running the pipeline

```bash
python3 scripts/extract_afp_hari.py                 # syllabus window (default, 2026 exam)
python3 scripts/extract_afp_hari.py --exam-year 2027  # shift window one year
python3 scripts/extract_afp_hari.py --all-years       # no date filter
python3 scripts/extract_afp_hari.py --force           # rebuild everything
```

Requires `pdftotext` (poppler-utils) on PATH.
