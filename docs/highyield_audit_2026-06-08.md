# High-Yield Bank — Independent Answer-Key Audit (Mishpacha Mega)

**Date:** 2026-06-08 · **Auditor model:** `opus` (temperature 0), blind · **Generator:** `claude-sonnet-4-6`

## What this audit checks — and what it does NOT

This is the **key-blind board-evidence pass** (`scripts/audit_keys_blind.mjs`). The auditor model was
shown **only the question stem + options** — never the answer key, never the explanation — and had to
pick the answer itself as a board-certified family physician (independent answer-key auditor, Goroll 8e / AFP / USPSTF / Israeli MOH), then state its confidence. We then compared its blind pick
to the keyed answer.

**A Q ships into this bank only if the blind auditor (a) independently picked the keyed answer AND
(b) was ≥85% confident.** Every Q below cleared both gates.

> **This audit confirms key↔independent-answer agreement only.** It does **not** certify Hebrew phrasing,
> distractor quality, clinical nuance, or freedom from ambiguity. Those remain part of your pre-merge
> human review. Anything the auditor disagreed with, or was <85% confident on, was **held OUT** of this
> bank (57 Qs) and is **not** in the PR.

## Provenance & gates

| | |
|---|---|
| Generated (raw) | 190 |
| Held out (flagged: disagree or conf<85) | 57 |
| **Shipped in this bank** | **133** |
| Blind auditor agreement on shipped | 133/133 (100%) |
| Confidence on shipped | min 85, mean 93.4 |
| In-app label | 🤖 AI — High-Yield (tag `AI-2026-hy`) |
| Self-consistency pass (key↔explanation) | `scripts/verify_questions.mjs` — 0 conflicts |

## Shipped Qs per topic

| ti | Topic | Count |
|---|---|---|
| 0 | Adult Cardiology — IHD & Arrhythmia | 12 |
| 1 | Heart Failure & Valves | 8 |
| 2 | Hypertension & Lipids | 7 |
| 3 | Pulmonology (Asthma, COPD, PE) | 5 |
| 4 | Gastroenterology & Hepatology | 6 |
| 5 | Nephrology, UTI & Urology | 4 |
| 6 | Endocrinology — Diabetes | 10 |
| 7 | Endocrinology — Thyroid & Other | 10 |
| 8 | Hematology & Coagulation | 9 |
| 10 | Neurology (Stroke, Headache, Dementia) | 5 |
| 11 | Dermatology | 6 |
| 12 | Allergy & Immunology | 7 |
| 16 | Men's Health | 6 |
| 17 | Geriatrics (Falls, Cognition, Polypharmacy) | 6 |
| 18 | Mental Health — Mood, Anxiety, Psychosis | 10 |
| 19 | Addictions & Lifestyle Behaviors | 8 |
| 20 | Preventive Medicine & Health Promotion | 9 |
| 21 | Pain, Palliative & End-of-Life | 5 |

## Per-question audit verdict (all 133 shipped Qs)

`#` = position in `data/highyield.json`. `Key` = the keyed answer letter(s). `Blind` = the auditor's
independent pick (matches an accepted key letter for every row, by construction). `Conf` = auditor confidence.

| # | ti | Topic | Key | Blind | Conf | Stem (first 60 chars) |
|---|---|---|---|---|---|---|
| 0 | 0 | Adult Cardiology — IHD & Arrhythmia | D | D | 92 | גבר בן 58 עם היסטוריה של אוטם שריר הלב לפני 6 חודשים, מטופל  |
| 1 | 2 | Hypertension & Lipids | A | A | 95 | גבר בן 58 עם יתר לחץ דם מטופל באמלודיפין 10 מ"ג ליום. לחץ הד |
| 2 | 1 | Heart Failure & Valves | B | B | 95 | גבר בן 68 עם אי-ספיקת לב עם ירידה בשבר פליטה (HFrEF, EF 30%) |
| 3 | 0 | Adult Cardiology — IHD & Arrhythmia | C | C | 92 | גבר בן 58 עם היסטוריה של אוטם שריר הלב לפני 6 חודשים, מדווח  |
| 4 | 2 | Hypertension & Lipids | C | C | 95 | גבר בן 58 עם יתר לחץ דם מטופל באמלודיפין 10 מ"ג ליממה. לחץ ד |
| 5 | 0 | Adult Cardiology — IHD & Arrhythmia | C | C | 90 | גבר בן 58, מעשן, עם יתר לחץ דם ורמת LDL של 145 מ"ג/ד"ל, מגיע |
| 6 | 2 | Hypertension & Lipids | A | A | 92 | גבר בן 58, מעשן, סובל מיתר לחץ דם מבוקר תחת אמלודיפין 5 מ"ג. |
| 7 | 0 | Adult Cardiology — IHD & Arrhythmia | C | C | 98 | גבר בן 58, מעשן, סובל מיתר לחץ דם ודיסליפידמיה. הגיע למרפאה  |
| 8 | 1 | Heart Failure & Valves | B | B | 95 | גבר בן 62 עם אי-ספיקת לב עם ירידה בתפקוד סיסטולי (EF 32%) מט |
| 9 | 2 | Hypertension & Lipids | A | A | 85 | גבר בן 58 עם יתר לחץ דם המטופל באמלודיפין 10 מ"ג/יום מגיע לב |
| 10 | 1 | Heart Failure & Valves | C | C | 95 | גבר בן 68 עם אי-ספיקת לב עם ירידה בשבר הפליטה (EF 30%) מטופל |
| 11 | 0 | Adult Cardiology — IHD & Arrhythmia | C | C | 88 | גבר בן 58 עם סוכרת סוג 2 ויתר לחץ דם מגיע לרופא המשפחה לביקו |
| 12 | 0 | Adult Cardiology — IHD & Arrhythmia | B | B | 99 | גבר בן 58 עם היסטוריה של אוטם שריר הלב לפני 3 שנים (EF 38%), |
| 13 | 0 | Adult Cardiology — IHD & Arrhythmia | C | C | 85 | גבר בן 58, מעשן 20 שנה, סובל מיתר לחץ דם ומדיאבטס סוג 2. הוא |
| 14 | 1 | Heart Failure & Valves | C | C | 97 | גבר בן 68, עם אי-ספיקת לב עם שבר פליטה מופחת (HFrEF, EF 30%) |
| 15 | 0 | Adult Cardiology — IHD & Arrhythmia | B | B | 92 | גבר בן 58, מעשן 20 שנות-חפיסה, עם יתר לחץ דם ורמת LDL של 145 |
| 16 | 2 | Hypertension & Lipids | D | D | 98 | גבר בן 58, מעשן חצי קופסת סיגריות ביום, סובל מסוכרת סוג 2 מז |
| 17 | 1 | Heart Failure & Valves | C | C | 98 | גבר בן 67 עם אי-ספיקת לב עם ירידה בתפקוד סיסטולי (EF 32%) מט |
| 18 | 2 | Hypertension & Lipids | B | B | 92 | גבר בן 58, מעשן חצי קופסה ליום, סובל מיתר לחץ דם מטופל באמלו |
| 19 | 1 | Heart Failure & Valves | C | C | 98 | גבר בן 68 עם אי-ספיקת לב עם ירידה בתפקוד סיסטולי (EF 32%) מט |
| 20 | 0 | Adult Cardiology — IHD & Arrhythmia | C | C | 92 | גבר בן 58, מעשן 20 שנות-קופסה, סובל מיתר לחץ דם ומסוכרת סוג  |
| 21 | 2 | Hypertension & Lipids | B | B | 92 | גבר בן 58, מעשן, סובל מיתר לחץ דם המטופל באמלודיפין 5 מ"ג. ב |
| 22 | 3 | Pulmonology (Asthma, COPD, PE) | A | A | 95 | גבר בן 68, מעשן כבד (50 חפיסה-שנה), מתלונן על קוצר נשימה במא |
| 23 | 0 | Adult Cardiology — IHD & Arrhythmia | B | B | 97 | גבר בן 58 עם אוטם שריר הלב קדמי לפני 6 שבועות, EF=38%, קצב ס |
| 24 | 1 | Heart Failure & Valves | C | C | 97 | גבר בן 62 עם אי-ספיקת לב עם ירידה בתפקוד סיסטולי (EF=32%) מט |
| 25 | 0 | Adult Cardiology — IHD & Arrhythmia | B | B | 98 | גבר בן 58, מעשן, סובל מיתר לחץ דם ומסוכרת סוג 2. מגיע למרפאה |
| 26 | 3 | Pulmonology (Asthma, COPD, PE) | B | B | 92 | גבר בן 68, מעשן כבד (45 קופסה-שנה), מתלונן על קוצר נשימה במא |
| 27 | 0 | Adult Cardiology — IHD & Arrhythmia | A | A | 92 | גבר בן 58, מעשן כבד, עם יתר לחץ דם ויתר שומנים בדם, מגיע למר |
| 28 | 1 | Heart Failure & Valves | A | A | 95 | גבר בן 58 עם אי-ספיקת לב עם ירידה בתפקוד סיסטולי (EF 32%) מט |
| 29 | 3 | Pulmonology (Asthma, COPD, PE) | B | B | 90 | גבר בן 68, מעשן כבד (50 קופסה-שנה), מתלונן על קוצר נשימה במא |
| 30 | 4 | Gastroenterology & Hepatology | A | A | 92 | גבר בן 52, לא מעשן, ללא תסמינים גסטרואינטסטינליים, פונה לרופ |
| 31 | 4 | Gastroenterology & Hepatology | A | A | 98 | גבר בן 54, ידוע עם שחמת כבד על רקע NAFLD (Child-Pugh A), מגי |
| 32 | 5 | Nephrology, UTI & Urology | D | D | 90 | גבר בן 68 מגיע למרפאה עם תלונות על תדירות מתן שתן מוגברת, דח |
| 33 | 3 | Pulmonology (Asthma, COPD, PE) | C | C | 95 | גבר בן 68, מעשן עבר (40 קופסה-שנה, הפסיק לפני 3 שנים), מתלונ |
| 34 | 4 | Gastroenterology & Hepatology | D | D | 95 | גבר בן 54 מגיע למרפאה לבדיקה שגרתית. אין לו תלונות. הוא שותה |
| 35 | 4 | Gastroenterology & Hepatology | A | A | 95 | גבר בן 52, ללא תלונות, מגיע לביקור שגרתי. אין לו תסמיני ריפל |
| 36 | 3 | Pulmonology (Asthma, COPD, PE) | D | D | 88 | גבר בן 68 עם היסטוריה של עישון 40 קופסה-שנה מגיע למרפאה לביק |
| 37 | 5 | Nephrology, UTI & Urology | A | A | 92 | גבר בן 68 עם סוכרת סוג 2 ויתר לחץ דם מגיע לביקורת תקופתית. ב |
| 38 | 5 | Nephrology, UTI & Urology | B | B | 90 | גבר בן 68 מגיע למרפאה עם תלונות על שתן דחוף, תכוף ופיזור חלש |
| 39 | 6 | Endocrinology — Diabetes | C | C | 98 | גבר בן 58, עם סוכרת מסוג 2 מזה 9 שנים, מטופל במטפורמין 2000  |
| 40 | 6 | Endocrinology — Diabetes | B | B | 95 | גבר בן 58, עם סוכרת סוג 2 מזה 10 שנים, מטופל במטפורמין 1000  |
| 41 | 4 | Gastroenterology & Hepatology | D | D | 97 | גבר בן 58, ללא תסמינים, מופנה לבדיקת סקר. בבדיקת דם: ALT 68  |
| 42 | 6 | Endocrinology — Diabetes | C | C | 95 | גבר בן 58 עם סוכרת מסוג 2 מזה 10 שנים מגיע למרפאה לביקור מעק |
| 43 | 5 | Nephrology, UTI & Urology | A | A | 85 | גבר בן 68 מגיע למרפאה עם תוצאות בדיקת דם שגרתית: קריאטינין 1 |
| 44 | 4 | Gastroenterology & Hepatology | A | A | 90 | גבר בן 52, עישון בעברו (30 קופסה-שנה, הפסיק לפני 5 שנים), BM |
| 45 | 7 | Endocrinology — Thyroid & Other | B | B | 85 | גבר בן 52 מגיע לרופא משפחה לבדיקה שגרתית. אין תלונות פעילות. |
| 46 | 6 | Endocrinology — Diabetes | B | B | 97 | גבר בן 58, עם סוכרת סוג 2 מזה 10 שנים, מטופל במטפורמין 2000  |
| 47 | 7 | Endocrinology — Thyroid & Other | D | D | 97 | גבר בן 52, מגיע לביקורת שגרתית. הוא מתלונן על עייפות, עצירות |
| 48 | 6 | Endocrinology — Diabetes | C | C | 92 | גבר בן 58, עם סוכרת סוג 2 מזה 9 שנים, מטופל במטפורמין 2000 מ |
| 49 | 7 | Endocrinology — Thyroid & Other | B | B | 92 | גבר בן 52 מגיע לרופא משפחה לביקור שגרתי. הוא מדווח על עייפות |
| 50 | 8 | Hematology & Coagulation | D | D | 90 | גבר בן 58 עם היסטוריה של פקקת ורידים עמוקה (DVT) לפני 3 שנים |
| 51 | 7 | Endocrinology — Thyroid & Other | C | C | 85 | גבר בן 52, ללא תלונות, מגיע לביקור שגרתי. בבדיקת דם שגרתית נ |
| 52 | 6 | Endocrinology — Diabetes | C | C | 95 | גבר בן 58, משקל עודף (BMI 31), ללא רקע רפואי ידוע. בבדיקה שג |
| 53 | 8 | Hematology & Coagulation | A | A | 90 | גבר בן 68 מגיע למרפאה לביקורת שגרתית. סובל מפרפור פרוזדורים  |
| 54 | 8 | Hematology & Coagulation | A | A | 97 | גבר בן 68 מגיע לרופא המשפחה לביקור שגרתי. בבדיקות דם שגרתיות |
| 55 | 7 | Endocrinology — Thyroid & Other | C | C | 92 | גבר בן 52 פונה למרפאת רפואת משפחה לבדיקה שגרתית. הוא מדווח ע |
| 56 | 8 | Hematology & Coagulation | C | C | 99 | גבר בן 68 עם פרצוף סגלגל, אדמומיות בפנים ובכפות הידיים, וטחו |
| 57 | 6 | Endocrinology — Diabetes | D | D | 99 | גבר בן 58, עם סוכרת סוג 2 מאובחנת מזה 10 שנים, מטופל במטפורמ |
| 58 | 8 | Hematology & Coagulation | C | C | 95 | גבר בן 58 עם היסטוריה של פקקת ורידים עמוקים (DVT) לפני 8 חוד |
| 59 | 6 | Endocrinology — Diabetes | D | D | 98 | גבר בן 58, עם סוכרת סוג 2 מזה 9 שנים, מטופל במטפורמין 1000 מ |
| 60 | 8 | Hematology & Coagulation | B | B | 92 | גבר בן 68 מגיע לרופא משפחה לביקורת שגרתית. סובל מפרפור פרוזד |
| 61 | 7 | Endocrinology — Thyroid & Other | D | D | 98 | גבר בן 52 מגיע לרופא המשפחה לביקור שגרתי. הוא מדווח על עייפו |
| 62 | 6 | Endocrinology — Diabetes | A | A | 98 | גבר בן 58, סוכרתי מסוג 2 כבר 9 שנים. מטופל במטפורמין 2000 מ" |
| 63 | 8 | Hematology & Coagulation | D | D | 92 | גבר בן 68 עם פרצוף של פוליציטמיה ורה (PV) מאובחנת לפני 3 שני |
| 64 | 7 | Endocrinology — Thyroid & Other | B | B | 90 | גבר בן 52 מגיע למרפאת רופא משפחה לביקור שגרתי. הוא מדווח על  |
| 65 | 6 | Endocrinology — Diabetes | C | C | 98 | גבר בן 58, עם סוכרת סוג 2 מזה 10 שנים, מטופל במטפורמין 1000  |
| 66 | 7 | Endocrinology — Thyroid & Other | B | B | 98 | גבר בן 58 מגיע לביקורת שגרתית. הוא מדווח על עייפות מתמשכת, ע |
| 67 | 8 | Hematology & Coagulation | B | B | 92 | גבר בן 68, לשעבר מעשן, מגיע למרפאה לביקורת שגרתית. בבדיקות ד |
| 68 | 7 | Endocrinology — Thyroid & Other | A | A | 92 | גבר בן 52, ידוע עם היפותירואידיזם ראשוני מזה 4 שנים, מטופל ב |
| 69 | 10 | Neurology (Stroke, Headache, Dementia) | C | C | 95 | גבר בן 72 עם יתר לחץ דם, סוכרת סוג 2 ופרפור פרוזדורים כרוני  |
| 70 | 7 | Endocrinology — Thyroid & Other | A | A | 95 | גבר בן 52 מגיע לרופא משפחה לביקור שגרתי. אין תלונות פעילות.  |
| 71 | 8 | Hematology & Coagulation | C | C | 90 | גבר בן 68 מגיע למרפאת רופא משפחה לביקורת שגרתית. הוא מדווח ע |
| 72 | 11 | Dermatology | B | B | 92 | גבר בן 58 עם היסטוריה של עבודה ממושכת בשמש פונה למרפאה עם נג |
| 73 | 12 | Allergy & Immunology | C | C | 99 | גבר בן 34 מגיע למרפאה לאחר תגובה אנפילקטית שנייה לעקיצת דבור |
| 74 | 10 | Neurology (Stroke, Headache, Dementia) | D | D | 97 | גבר בן 68 עם יתר לחץ דם מטופל באמלודיפין ואטורבסטטין, סוכרת  |
| 75 | 11 | Dermatology | B | B | 98 | גבר בן 58, מעשן לשעבר, מגיע למרפאת רפואת משפחה לבדיקה שגרתית |
| 76 | 12 | Allergy & Immunology | C | C | 98 | גבר בן 34 מגיע למרפאה עם תלונות חוזרות של נזלת, גודש באף, וג |
| 77 | 10 | Neurology (Stroke, Headache, Dementia) | D | D | 95 | גבר בן 68, יתר לחץ דם מטופל באמלודיפין, סוכרת סוג 2 מאוזנת,  |
| 78 | 12 | Allergy & Immunology | D | D | 88 | גבר בן 34 מגיע למרפאת רפואת משפחה עם היסטוריה של אלרגיה לפני |
| 79 | 11 | Dermatology | B | B | 95 | גבר בן 58 מגיע למרפאת רפואת משפחה לביקור שגרתי. בבדיקה גופני |
| 80 | 12 | Allergy & Immunology | B | B | 90 | גבר בן 34 מגיע למרפאה עם היסטוריה של נזלת אלרגית עונתית שאינ |
| 81 | 10 | Neurology (Stroke, Headache, Dementia) | B | B | 92 | גבר בן 72, יתר לחץ דם מטופל באמלודיפין, מגיע למרפאה עם תלונה |
| 82 | 12 | Allergy & Immunology | B | B | 95 | גבר בן 34 מגיע למרפאה לאחר תגובה אנפילקטית לאחר אכילת בוטנים |
| 83 | 10 | Neurology (Stroke, Headache, Dementia) | C | C | 95 | גבר בן 68 עם יתר לחץ דם מטופל ופרצוץ פרוזדורים (AF) לא וולבו |
| 84 | 11 | Dermatology | A | A | 95 | גבר בן 58 מגיע למרפאת רפואת משפחה עם כתם חום-שחור א-סימטרי ע |
| 85 | 12 | Allergy & Immunology | D | D | 95 | גבר בן 34 מגיע למרפאה עם היסטוריה של אורטיקריה כרונית ספונטנ |
| 86 | 11 | Dermatology | B | B | 85 | גבר בן 58, מעשן לשעבר, מגיע למרפאה ראשונית עם נגע בעור הפנים |
| 87 | 12 | Allergy & Immunology | A | A | 95 | גבר בן 34 מגיע למרפאה עם אורטיקריה כרונית ספונטנית (CIU) מזה |
| 88 | 11 | Dermatology | B | B | 95 | גבר בן 58, מעשן לשעבר, מגיע לביקורת שגרתית. בבדיקה גופנית מת |
| 89 | 16 | Men's Health | B | B | 90 | גבר בן 52, מעשן 30 קופסה-שנה, פונה לרופא המשפחה לבדיקה שגרתי |
| 90 | 17 | Geriatrics (Falls, Cognition, Polypharmacy) | C | C | 92 | גבר בן 78 מגיע לרופא משפחה לביקורת שגרתית. הוא מדווח על שתי  |
| 91 | 18 | Mental Health — Mood, Anxiety, Psychosis | C | C | 92 | גבר בן 52, נשוי, מגיע לרופא משפחה לביקור שגרתי. אשתו מלווה א |
| 92 | 17 | Geriatrics (Falls, Cognition, Polypharmacy) | C | C | 92 | גבר בן 78 מגיע למרפאה לביקור שגרתי. הוא מתגורר לבדו, עצמאי ב |
| 93 | 16 | Men's Health | A | A | 95 | גבר בן 54, מעשן 30 חפיסות-שנה, ללא תלונות, מגיע לביקור שגרתי |
| 94 | 18 | Mental Health — Mood, Anxiety, Psychosis | D | D | 98 | גבר בן 42, נשוי, פונה למרפאת רפואת המשפחה בשל עייפות, ירידה  |
| 95 | 17 | Geriatrics (Falls, Cognition, Polypharmacy) | D | D | 98 | גבר בן 78 מגיע למרפאת רופא משפחה לביקור שגרתי. הוא מדווח על  |
| 96 | 18 | Mental Health — Mood, Anxiety, Psychosis | A | A | 99 | גבר בן 38 מגיע למרפאת רפואת משפחה עם תלונות על עצבות מתמשכת, |
| 97 | 16 | Men's Health | C | C | 98 | גבר בן 54, מעשן 30 קופסה-שנה, ללא תלונות, מגיע לבדיקה שגרתית |
| 98 | 17 | Geriatrics (Falls, Cognition, Polypharmacy) | B | B | 92 | אישה בת 78, מתגוררת בביתה באופן עצמאי, מגיעה למרפאה לביקור ש |
| 99 | 18 | Mental Health — Mood, Anxiety, Psychosis | D | D | 92 | גבר בן 42 מגיע למרפאת רפואת משפחה עם תלונות של עצבות מתמשכת, |
| 100 | 16 | Men's Health | A | A | 92 | גבר בן 54, מעשן 30 קופסה-שנה, פונה למרפאת רופא משפחה לבדיקה  |
| 101 | 18 | Mental Health — Mood, Anxiety, Psychosis | B | B | 88 | גבר בן 52, נשוי, מגיע למרפאת קהילה לביקור מעקב. לפני שלושה ש |
| 102 | 16 | Men's Health | B | B | 85 | גבר בן 52 מגיע לביקורת שגרתית. אינו מעשן, לחץ דם 128/80 ממ"כ |
| 103 | 18 | Mental Health — Mood, Anxiety, Psychosis | A | A | 95 | גבר בן 52, נשוי, פונה למרפאת משפחה לביקור שגרתי. אין לו עבר  |
| 104 | 16 | Men's Health | A | A | 90 | גבר בן 54, מעשן 30 קופסה-שנה, פונה למרפאת משפחה לבדיקה שגרתי |
| 105 | 18 | Mental Health — Mood, Anxiety, Psychosis | A | A | 92 | גבר בן 52, נשוי, מגיע למרפאת רופא המשפחה לביקורת שגרתית. אשת |
| 106 | 19 | Addictions & Lifestyle Behaviors | C | C | 85 | גבר בן 47 מגיע לקליניקה לרפואת משפחה לביקור מעקב. הוא מעשן ח |
| 107 | 17 | Geriatrics (Falls, Cognition, Polypharmacy) | B | B | 85 | גבר בן 78 מגיע למרפאה לביקור שגרתי. הוא מדווח על שתי נפילות  |
| 108 | 18 | Mental Health — Mood, Anxiety, Psychosis | A | A | 98 | גבר בן 52, נשוי, מגיע למרפאת רופא משפחה לביקור שגרתי. אינו מ |
| 109 | 19 | Addictions & Lifestyle Behaviors | D | D | 92 | גבר בן 45, מעשן 1 חפיסה ביום במשך 20 שנה, מבקש עזרה להפסקת ע |
| 110 | 18 | Mental Health — Mood, Anxiety, Psychosis | B | B | 92 | גבר בן 52, נשוי, מגיע למרפאת רופא משפחה לביקור שגרתי. אינו מ |
| 111 | 19 | Addictions & Lifestyle Behaviors | B | B | 88 | גבר בן 42 מגיע לרופא המשפחה לביקור שגרתי. הוא מעשן 20 סיגריו |
| 112 | 17 | Geriatrics (Falls, Cognition, Polypharmacy) | B | B | 92 | גבר בן 78, גר לבדו בביתו, מגיע לביקור שגרתי. בשנה האחרונה נפ |
| 113 | 18 | Mental Health — Mood, Anxiety, Psychosis | B | B | 85 | גבר בן 34 מגיע למרפאת רופא משפחה לביקור מעקב. לפני שלושה שבו |
| 114 | 19 | Addictions & Lifestyle Behaviors | B | B | 95 | גבר בן 45 מגיע לרופא משפחה לביקור שגרתי. הוא מדווח ששותה כוס |
| 115 | 20 | Preventive Medicine & Health Promotion | B | B | 95 | גבר בן 55, מעשן 30 קופסה-שנה, ללא תסמינים נשימתיים, פונה לרו |
| 116 | 19 | Addictions & Lifestyle Behaviors | A | A | 85 | גבר בן 45, מעשן 1 חפיסת סיגריות ליום במשך 20 שנה, פונה למרפא |
| 117 | 20 | Preventive Medicine & Health Promotion | C | C | 95 | גבר בן 55, מעשן 30 חפיסות-שנה, פנה למרפאת רופא משפחה לבדיקה  |
| 118 | 19 | Addictions & Lifestyle Behaviors | C | C | 95 | גבר בן 45 מגיע לרופא המשפחה לביקור שגרתי. הוא מעשן חפיסה אחת |
| 119 | 20 | Preventive Medicine & Health Promotion | B | B | 98 | גבר בן 55, מעשן 30 שנות-קופסה, פונה לרופא המשפחה לבדיקה שגרת |
| 120 | 19 | Addictions & Lifestyle Behaviors | D | D | 98 | גבר בן 45 מגיע למרפאה לביקור שגרתי. הוא מעשן חצי קופסת סיגרי |
| 121 | 21 | Pain, Palliative & End-of-Life | B | B | 90 | גבר בן 68 עם סרטן ריאה גרורתי מגיע למרפאה לרופא משפחה. הוא מ |
| 122 | 19 | Addictions & Lifestyle Behaviors | C | C | 92 | גבר בן 42 מגיע לרופא משפחה לביקור שגרתי. הוא מעשן חצי קופסת  |
| 123 | 21 | Pain, Palliative & End-of-Life | B | B | 95 | גבר בן 68 עם סרטן ריאה גרורתי מוכר, סובל מכאב כרוני עז בדירו |
| 124 | 20 | Preventive Medicine & Health Promotion | B | B | 92 | גבר בן 55, מעשן 30 קופסה-שנה, מעשן כיום. ללא תסמינים נשימתיי |
| 125 | 20 | Preventive Medicine & Health Promotion | A | A | 98 | גבר בן 58, מעשן 30 חפיסה-שנה, מעשן כיום. פונה למרפאה לביקור  |
| 126 | 21 | Pain, Palliative & End-of-Life | A | A | 85 | גבר בן 68 עם סרטן ריאה גרורתי מגיע למרפאה עם כאב שלד כרוני ב |
| 127 | 20 | Preventive Medicine & Health Promotion | C | C | 98 | גבר בן 55, מעשן 30 קופסה-שנה, ללא תסמינים נשימתיים. לחץ דם 1 |
| 128 | 20 | Preventive Medicine & Health Promotion | D | D | 98 | גבר בן 55, מעשן 30 קופסה-שנה, ללא תסמינים נשימתיים. לחץ דם 1 |
| 129 | 20 | Preventive Medicine & Health Promotion | C | C | 98 | גבר בן 55, מעשן 30 קופסה-שנה, ללא תלונות נשימתיות. לחץ דם 12 |
| 130 | 21 | Pain, Palliative & End-of-Life | A | A | 95 | גבר בן 68 עם סרטן ריאה גרורתי מגיע למרפאה עם כאב עצמות עקב ג |
| 131 | 20 | Preventive Medicine & Health Promotion | C | C | 98 | גבר בן 55, מעשן 30 קופסה-שנה, מעשן כיום. מגיע לביקור שגרתי.  |
| 132 | 21 | Pain, Palliative & End-of-Life | B | B | 85 | גבר בן 68 עם סרטן ריאה גרורתי מטופל במורפין מושחרר (slow-rel |

---
_Generated by `.audit_logs/highyield_2026-06-08/build_audit_doc.cjs` from the committed bank +
the blind-audit report. Reconstruction was verified equal to `data/highyield.json` (length + per-Q stem)._
