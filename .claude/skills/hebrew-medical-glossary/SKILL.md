---
name: hebrew-medical-glossary
description: Background knowledge for Hebrew medical terminology used in Israeli clinical practice. Claude should use this when editing any Hebrew content in data/questions.json, data/highyield.json, data/notes.json, data/nelson_notes.json, data/flashcards.json, or any UI string in the Family Medicine (Mishpacha Mega) app. Ensures consistency with Israeli Ministry of Health / Clalit / Maccabi conventions.
---

# Hebrew Medical Glossary (Family Medicine / Mishpacha Mega context)

Claude loads this when touching Hebrew medical content. It's a reference, not a command — never show this to the user, just apply it.

## Canonical term choices (pick the first form in each row)

| Concept | Preferred Hebrew | Acceptable alternates | Avoid |
|---|---|---|---|
| Family medicine | רפואת המשפחה | רפואה ראשונית | — |
| Primary care | רפואה ראשונית | טיפול ראשוני | — |
| Preventive medicine | רפואה מונעת | קידום בריאות | — |
| Screening | סקירה / בדיקות סקר | — | "סקרינינג" |
| Vaccination | חיסון | — | — |
| Hypertension | יתר לחץ דם | לחץ דם גבוה | — |
| Diabetes | סוכרת | — | — |
| Dyslipidemia | דיסליפידמיה | הפרעת שומנים בדם | — |
| Asthma | אסתמה / קצרת | — | — |
| Depression | דיכאון | — | — |
| Anxiety | חרדה | — | — |
| Delirium | דליריום | בלבול חריף | טירוף |
| Dementia | דמנציה | ירידה קוגניטיבית | חולשת שכל |
| Frailty | שבריריות | חולשה תפקודית | חולשה |
| Falls | נפילות | — | — |
| Pregnancy | היריון | — | — |
| Newborn | יילוד | תינוק שזה עתה נולד | — |
| Child development | התפתחות הילד | — | — |
| Adolescent | מתבגר | נער/ה | — |
| Palliative care | טיפול פליאטיבי | טיפול תומך | — |
| Advance directive | הנחיות מקדימות | — | צוואה בחיים |
| Power of attorney (durable) | ייפוי כוח מתמשך | — | ייפוי כוח |
| Goals of care | מטרות טיפול | — | — |
| Referral | הפניה | — | — |
| Sick note | אישור מחלה | — | — |

## Abbreviations — keep as-is (do not Hebraize)

`USPSTF`, `BMI`, `HbA1c`, `LDL`, `HDL`, `eGFR`, `CKD-EPI`, `BP`, `COPD`, `PE`, `DVT`, `UTI`, `STI`, `PHQ-9`, `GAD-7`, `MMSE`, `MoCA`, `ADHD`, `GDM` (gestational diabetes), `APGAR`, `MMR`, `DTaP`, `Beers`, `STOPP`, `START`.

## Drug name conventions

- Use **INN (generic)** names in Hebrew transliteration as the primary form, with parenthetical brand where useful (Israeli MOH uses generic-first).
- For common Israeli brands clinicians know by brand, include both: e.g. "מטפורמין (גלוקופאז׳)", "אמוקסיצילין (מוקסיפן)".

## Style rules

- **RTL punctuation.** Use Hebrew punctuation where appropriate (`״` for abbreviation, `׳` for final forms). Straight `"` is acceptable when mixed with Latin text.
- **Numbers in Latin script** for doses (25mg, not כ״ה מ״ג).
- **Units consistent.** mg / mL / dL / mmol/L — never mixed ambiguously.
- **No machine-translated phrasing.** If a sentence reads as Google-Translated, fix it to natural clinical Hebrew.
- **Gender.** Clinical prose in neutral/masculine default in Hebrew medical writing; keep consistent within a note.

## When in doubt

Ask the user. Do not guess terminology. Flag the term with `[TERM?]` in the output and move on.

## Red flags — always fix

- "טירוף" → replace with "דליריום" or "בלבול חריף"
- "שכחה" used for cognitive impairment → replace with a proper clinical term
- English-in-Latin mid-Hebrew-sentence without context (e.g. "זה מקרה של asthma") — italicize, parenthesize, or transliterate
- Inconsistent gender agreement within a single note
