#!/usr/bin/env node
// v1.4.5 — audit-driven seed expansion. Targets ranked thin-vs-weight items #2-4:
//   ti 9  Rheum/MSK           (IMA wt 11, ratio 4.36)
//   ti 24 Peds-Acute/Infect   (IMA wt 12, ratio 6.25)
//   ti 3  Pulm                (IMA wt  4, ratio 6.50)
// +5 Qs each = +15 total. Parity-length distractors, ref/ref_slug populated.

import fs from 'node:fs';

const seedPath = 'data/ai_hard_seed.json';
const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

const newQs = [
  // ========== ti 9 Rheum/MSK (5 Qs) ==========
  {
    q: "גבר בן 45 מתלונן על כאב גב תחתון של 3 שבועות לאחר הרמה. אין חום, אין ירידה במשקל, אין היסטוריית סרטן, ללא סימנים נוירולוגיים פוקליים, ללא שימוש ב-IV drugs. מה הצעד הבא הנכון?",
    o: [
      "MRI lumbar spine דחוף לשלילת herniated disc",
      "Plain X-ray LS כבדיקת סקר ראשונית לכאב גב",
      "טיפול שמרני + NSAID 4–6 שבועות, ללא הדמיה",
      "CT myelogram לאפיון אנטומיה ולכיוון טיפול"
    ],
    c: 2,
    c_accept: [2],
    t: "AI-Hard-G",
    st: "LBP — no imaging without red flags (ACP 2017)",
    ti: 9,
    e: "Acute uncomplicated LBP ללא red flags (חום/ירידה במשקל/סרטן/IV drugs/גיל >50 first-time/חסר נוירו/חבלה/אי שליטה על סוגרים) → ללא הדמיה ב-4–6 שבועות ראשונים; הרוב משתפר שמרנית. הדמיה מוקדמת מעלה ניתוחים ללא תועלת ומגדילה חרדה. ACP 2017, AFP 2018. Goroll 8e Ch 151.",
    src: "Goroll 8e — Primary Care Medicine",
    ref: "Goroll 8e Ch 151 — Back Pain",
    ref_slug: "low-back-pain-afp-2018"
  },
  {
    q: "אישה בת 62 עם OA ברך bilateral, BMI 32, כאב 5/10 המחמיר אחרי הליכה. ניסתה Tylenol 3 גרם/יום ללא הקלה. מה ההמלצה הבאה המועדפת?",
    o: [
      "TKR מיידי — החלפת ברך מלאה ללא המתנה לשמרני",
      "Topical NSAID + exercise/PT + ירידה במשקל ≥5%",
      "Intra-articular hyaluronic acid כקו שני אחרי NSAID",
      "Opioid short-course קצר לשליטה בכאב יומי כרוני"
    ],
    c: 1,
    c_accept: [1],
    t: "AI-Hard-AFP",
    st: "Knee OA — first-line after paracetamol fails (ACR 2019)",
    ti: 9,
    e: "ACR 2019: לאחר Tylenol → topical NSAID (דיקלופנק gel) מועדף על oral NSAID ב-OA ברך (יעילות דומה, פחות GI/renal). הוספת תרגול מובנה וירידה במשקל 5–10% מורידה כאב יותר מכל פרמקותרפיה. TKR שמור ל-OA מתקדם שנכשל בטיפול שמרני 3–6 חודשים. HA injections — יעילות נמוכה, לא מומלץ ACR. Opioid — conditional recommendation against. AFP 2023.",
    src: "AFP — Knee Osteoarthritis Management 2023",
    ref: "AFP 2023 — Knee OA",
    ref_slug: "knee-oa-management-2023"
  },
  {
    q: "גבר בן 55 עם כאב כתף ימין 6 שבועות. בבדיקה: full AROM פעיל + פסיבי, Jobe test חיובי, drop arm test שלילי. US: partial-thickness tear של supraspinatus (30%). מה הצעד הבא המומלץ?",
    o: [
      "ניתוח ארטרוסקופי לתיקון ה-tear",
      "PT + NSAID 6–12 שבועות לפני שיקול ניתוח",
      "Subacromial corticosteroid injection פעמיים בחודש",
      "הגבלת כתף ב-sling 4 שבועות + מעקב חוזר"
    ],
    c: 1,
    c_accept: [1],
    t: "AI-Hard-AFP",
    st: "Rotator cuff — partial-thickness tear conservative first",
    ti: 9,
    e: "Partial-thickness rotator cuff tear (<50%) + drop arm שלילי = ניסיון שמרני (PT מכוונת + NSAID) ל-6–12 שבועות לפני שיקול ניתוח. Full-thickness tear עם irreversible muscle atrophy או failed conservative → הפנייה לאורתופד. Immobilization ממושכת גורמת ל-frozen shoulder. Repeated steroid injections (>2 בשנה) מחלישות את הגיד. AFP 2019.",
    src: "AFP — Rotator Cuff Evaluation 2019",
    ref: "AFP 2019 — Rotator Cuff",
    ref_slug: "rotator-cuff-afp-2019"
  },
  {
    q: "גבר בן 58 עם התקף acute gout רביעי בשנה. Urate = 8.9 mg/dL. ניהל סיום התקף נוכחי עם colchicine. מה ההמלצה בנוגע ל-urate-lowering therapy (ULT)?",
    o: [
      "המתנה 4–6 שבועות מסיום ההתקף ואז allopurinol עם colchicine prophylaxis",
      "לא ULT — רק אורח חיים + מעקב urate כל 3 חודשים ללא הוספת תרופה",
      "allopurinol מיידי ללא cover — הורדת urate חשובה יותר מסיכון flare מיידי",
      "Febuxostat first-line במינון גבוה 80 מ\"ג/יום ללא colchicine prophylaxis"
    ],
    c: 0,
    c_accept: [0, 2],
    t: "AI-Hard-G",
    st: "Gout — ULT indication + timing (ACR 2020)",
    ti: 9,
    e: "אינדיקציות ULT לפי ACR 2020: ≥2 flares/שנה (כמו כאן), tophi, CKD≥3, או כליות+gout. מתחילים alopurinol 100 מ\"ג ו-titrate ל-urate <6 mg/dL. הגישה הקלאסית הייתה המתנה 4–6 שבועות מההתקף. עדכון 2020 מאפשר התחלה במהלך ההתקף (c=2 מקובל כיום) כל עוד יש anti-inflammatory cover (colchicine 0.6 מ\"ג x 1–2/יום ל-3–6 חודשים) למניעת flare ראשוני. Febuxostat שני-קו (CV risk). AFP 2020.",
    src: "Goroll 8e — Primary Care Medicine",
    ref: "Goroll 8e Ch 164 — Gout & Hyperuricemia",
    ref_slug: "gout-act-2020"
  },
  {
    q: "אישה בת 52 עם כאב + נפיחות ב-MCP ו-PIP bilaterally 10 שבועות, morning stiffness >1 hour, CRP 28, RF חיובי נמוך, anti-CCP חיובי גבוה. מה הצעד הבא?",
    o: [
      "Trial של NSAID לחודש ומעקב, נוגדני RA כנראה false-positive",
      "הפניית ברומטולוג להתחלת DMARD (methotrexate), לא לעכב",
      "Steroid PO כמונוטרפיה ממושכת עד לשיפור סימפטומטי מלא",
      "HCQ כ-monotherapy first-line — מספיק ב-early RA"
    ],
    c: 1,
    c_accept: [1],
    t: "AI-Hard-G",
    st: "RA — refer early for DMARD, window-of-opportunity",
    ti: 9,
    e: "Symmetric polyarthritis של small joints >6 שבועות + anti-CCP חיובי = RA בהסתברות גבוהה (anti-CCP ספציפי ~95%). Window-of-opportunity: התחלת DMARD (methotrexate first-line) תוך 3 חודשים משיפור משמעותי של prognosis ומניעת erosive joint damage. הפנייה לברומטולוג מיידית. NSAID/steroid רק bridging. HCQ מונוטרפיה שמור ל-mild RA ללא erosions — לא נכון לחולה עם high-titer anti-CCP. ACR 2021, AFP 2018.",
    src: "Goroll 8e — Primary Care Medicine",
    ref: "Goroll 8e Ch 156 — Rheumatoid Arthritis",
    ref_slug: "ra-early-dmard-afp-2018"
  },

  // ========== ti 24 Peds-Acute/Infect (5 Qs) ==========
  {
    q: "ילד בן 8 חודשים מגיע לחום 39.5°C של 24 שעות, ללא מקור ברור בבדיקה. נראה well-appearing, אוכל, שותה. היסטוריה תקינה, חיסונים מלאים. מה הבדיקה הראשונה המומלצת?",
    o: [
      "CRP + ESR + procalcitonin לניטור דלקת מערכתית ראשוני",
      "Blood culture + CBC empiric לפני השלמת אבחנה מערכתית",
      "Urinalysis + urine culture — UTI המקור החבוי השכיח",
      "CXR routine לשלילת pneumonia subclinical occult בגיל"
    ],
    c: 2,
    c_accept: [2],
    t: "AI-Hard-N",
    st: "FWS 3–24mo — UTI screen is priority",
    ti: 24,
    e: "Fever without source (FWS) בגיל 3–24 חודשים, well-appearing + חיסונים מלאים (HiB + PCV13) → הסיכון ל-occult bacteremia צנח ל-<0.5%. UTI לעומת זאת נשאר השכיח (7–8% בבנות <2y, 2–3% בבנים <1y), לא נימול). Urinalysis + culture הוא הצעד הראשון. Blood culture + empiric abx לא מומלצים routinely ב-well-appearing. AAP 2016 UTI guideline + Nelson Ch 202.",
    src: "Nelson Textbook of Pediatrics 22e",
    ref: "Nelson Ch 202 — Fever Without Source",
    ref_slug: "peds-fws-aap-2016"
  },
  {
    q: "ילד בן 14 חודשים עם AOM אמצעית ימין, חום 38.8°C, כאב אוזן מבודד ל-24 שעות, TM אדום בולט, ללא otorrhea. לא אלרגי לפניצילין. מה ההמלצה?",
    o: [
      "Amoxicillin 80–90 mg/kg/day × 10 ימים",
      "Watchful waiting 48–72 שעות עם רשם מוכן \"safety-net\"",
      "Amoxicillin-clavulanate first-line כי הוא <2y",
      "Azithromycin 5-day course כתחליף לפניצילין"
    ],
    c: 0,
    c_accept: [0],
    t: "AI-Hard-N",
    st: "AOM — Abx mandatory under 2 with unilateral + fever",
    ti: 24,
    e: "AAP 2013: antibiotics חובה בגיל <6 חודשים (כל AOM), גיל 6–23 חודשים עם severe signs (otalgia משמעותית >48h, חום ≥39, bilateral, otorrhea) או unilateral AOM עם סימנים severe. Watchful waiting מותר רק ב-6–23 חודשים אם mild AOM + hvardalsa מוודא. במקרה זה: גיל 14 חודשים + חום 38.8 = severe → amoxicillin high-dose 80–90 mg/kg/day, 10 ימים מתחת ל-2y. Amox-clav שמור לכישלון Amox 48–72h או recent Abx. Azithromycin לא first-line (עמידות). Nelson Ch 658.",
    src: "Nelson Textbook of Pediatrics 22e",
    ref: "Nelson Ch 658 — Otitis Media",
    ref_slug: "aom-aap-2013"
  },
  {
    q: "ילדה בת 5 עם כאב גרון 2 ימים, חום 38.6°C, צווארי קדמי רגיש, tonsillar exudate, ללא שיעול, ללא rhinorrhea. מה הצעד הנכון?",
    o: [
      "טיפול אמפירי ב-amoxicillin 10 ימים ללא בדיקת מעבדה ראשונית",
      "Rapid strep; אם חיובי penicillin V, אם שלילי culture מאשש אבחנה",
      "Throat culture ללא rapid test (חזרת תוצאה 48h ללא cover ראשוני)",
      "Observation 72 שעות, רוב הכאב וויראלי גם ב-McIsaac גבוה"
    ],
    c: 1,
    c_accept: [1],
    t: "AI-Hard-N",
    st: "Strep pharyngitis — test before treat (Centor/McIsaac)",
    ti: 24,
    e: "ילדה בת 5 עם McIsaac 4 (חום, אין שיעול, bassinger nodes, tonsillar exudate, גיל 3–14 = +1) → הסתברות GAS ~40%. IDSA 2012: לפני טיפול יש לאמת GAS (rapid antigen test; אם שלילי בילדים → throat culture — רגישות RADT ב-children ~85%). טיפול אמפירי ללא בדיקה = overtreatment של viral pharyngitis, ו-GAS treatment מונע rheumatic fever רק אם אכן GAS. Penicillin V / amoxicillin 10 ימים היא הבחירה אחרי אישור. Nelson Ch 409.",
    src: "Nelson Textbook of Pediatrics 22e",
    ref: "Nelson Ch 409 — Streptococcal Pharyngitis",
    ref_slug: "strep-pharyngitis-idsa-2012"
  },
  {
    q: "ילד בן 3 שנים, חום 39.5 °C כבר 6 ימים, שפתיים יבשות וסדוקות, strawberry tongue, rash polymorphic בגוף, bilateral conjunctival injection ללא הפרשה, נפיחות יד וכף רגל, adenopathy צווארי 1.8 ס\"מ חד-צדדי. מה הצעד הבא?",
    o: [
      "Trial של amoxicillin + throat culture לשלילת strep",
      "אשפוז + IVIG 2 g/kg + aspirin + echo הדמיה בסיסית",
      "EBV serology + CBC — חשד למונונוקליאוזיס דיסמטי",
      "Outpatient של viral exanthem — צפוי לחלוף תוך ימים"
    ],
    c: 1,
    c_accept: [1],
    t: "AI-Hard-N",
    st: "Kawasaki — 5/6 criteria, IVIG window",
    ti: 24,
    e: "Classic Kawasaki disease: חום ≥5 ימים + ≥4 מתוך 5: (1) conjunctivitis bilateral non-exudative (2) oral changes (strawberry tongue, cracked lips) (3) polymorphous rash (4) extremity changes (נפיחות/אריתמה) (5) cervical lymphadenopathy חד-צדדית ≥1.5 ס\"מ. הילד עונה 5/5. אבחנה מיידית + IVIG 2 g/kg single dose תוך 10 ימים מההחלה (מוריד coronary aneurysm risk מ-25% ל-5%), aspirin high-dose (80–100 mg/kg/day) עד חסר חום, ואז low-dose 3–5 mg/kg עד ECHO תקין. Nelson Ch 191.",
    src: "Nelson Textbook of Pediatrics 22e",
    ref: "Nelson Ch 191 — Kawasaki Disease",
    ref_slug: "kawasaki-disease-aha-2017"
  },
  {
    q: "תינוקת בת 5 שבועות עם חום 38.5°C, אירגנטית, האכלה ירודה. איזה משטר אנטיביוטי אמפירי מומלץ לחשד מנינגיטיס עד לקבלת תוצאות LP?",
    o: [
      "Ceftriaxone monotherapy — מכסה את הפתוגנים העיקריים בגיל זה",
      "Ampicillin + cefotaxime — Listeria + GBS + gram-negatives",
      "Vancomycin + ceftriaxone — כיסוי ל-resistant pneumococcus",
      "Ampicillin + gentamicin only — מתאים בגילאי <4 שבועות בלבד"
    ],
    c: 1,
    c_accept: [1],
    t: "AI-Hard-N",
    st: "Neonatal/young-infant meningitis — empiric Abx",
    ti: 24,
    e: "תינוק <1 חודש: ampicillin + gentamicin (OR + cefotaxime; cefotaxime קשה להשיג, חלופה: אמפיצילין + gentamicin + ceftazidime/cefepime). גיל 1–3 חודשים (כמו כאן): ampicillin (Listeria + Enterococcus) + cefotaxime/ceftriaxone (pneumococcus, meningococcus, H. flu, gram-neg). Ceftriaxone יחיד לא מכסה Listeria. Vanc + ceftriaxone — מעל 3 חודשים עם חשד ל-resistant pneumococcus. Ampicillin + gentamicin בלבד אינו מספק כיסוי E. coli/pneumococcus בגיל זה. Nelson Ch 622.",
    src: "Nelson Textbook of Pediatrics 22e",
    ref: "Nelson Ch 622 — Acute Bacterial Meningitis",
    ref_slug: "infant-meningitis-aap-2019"
  },

  // ========== ti 3 Pulm (5 Qs) ==========
  {
    q: "גבר בן 68, COPD, FEV1 55% predicted, CAT score 18, 2 exacerbations בשנה שעברה (אחד אשפוזי). כעת מטופל ב-LABA מונוטרפי. מה הצעד הבא לפי GOLD 2024?",
    o: [
      "הוספת ICS — יעבור ל-LABA/ICS",
      "הוספת LAMA — יעבור ל-LABA/LAMA",
      "מעבר ל-LABA/LAMA/ICS triple therapy",
      "הוספת roflumilast + azithromycin לטיפול קיים"
    ],
    c: 2,
    c_accept: [2],
    t: "AI-Hard-G",
    st: "COPD — GOLD Group E escalation (≥2 exacerbations OR 1 hospitalization)",
    ti: 3,
    e: "GOLD 2024: הקבצה חדשה ABE (במקום ABCD הישן). Group E = exacerbations ≥2 moderate or ≥1 leading to hospitalization בשנה → בחירה ראשונה LABA/LAMA, אך אם blood eosinophils ≥300 או היסטוריה של אסתמה → התחלת LABA/LAMA/ICS. אצל המטופל 1 אשפוז + 1 נוסף = Group E. המעבר ל-triple therapy מוצדק. Goroll 8e Ch 47.",
    src: "Goroll 8e — Primary Care Medicine",
    ref: "Goroll 8e Ch 47 — COPD",
    ref_slug: "copd-gold-2024"
  },
  {
    q: "אישה בת 45, כאב חזה פלאוריטי + דיספניאה 1 יום אחרי טיסה טרנס-אטלנטית. Wells score = 2. ב-outpatient setting. מה הצעד הראשון הנכון?",
    o: [
      "CTPA מיידי — חשד PE גבוה מספיק",
      "D-dimer; אם שלילי — PE נשללת, שחרור עם מעקב",
      "V/Q scan first-line לחשד PE ב-outpatient",
      "Empiric anticoagulation עד השלמת בירור הדמיה"
    ],
    c: 1,
    c_accept: [1],
    t: "AI-Hard-AFP",
    st: "PE — Wells <4 → D-dimer first (ADJUST-PE)",
    ti: 3,
    e: "Wells score ≤4 = PE unlikely; במצב זה D-dimer (age-adjusted cutoff ≥50y: age×10) שלילי → rule-out PE ללא הדמיה. אם D-dimer חיובי → CTPA. Wells >4 = PE likely → CTPA מיידי ללא D-dimer. V/Q שמור ל-contraindication ל-CTPA (הריון, אלרגיה לניגוד, CKD קשה). Empiric anticoagulation נשמר לחולה unstable או טווח המתנה ל-CTPA ארוך. AFP 2017, BMJ 2020.",
    src: "AFP — Pulmonary Embolism Diagnosis 2017",
    ref: "AFP 2017 — PE Diagnosis",
    ref_slug: "pe-diagnosis-afp-2017"
  },
  {
    q: "גבר בן 32, אסתמה, משתמש ב-ICS-formoterol (Symbicort) SMART — גם maintenance 2×/יום וגם reliever. בחודש האחרון השתמש ב-≥4 puffs reliever/יום במשך 5 ימים. מה הצעד הבא?",
    o: [
      "חקירת triggers/adherence/technique לפני הגדלת ICS-formoterol",
      "Step-down ICS במטרה להפחית תופעות לוואי לטווח ארוך ומיידי",
      "הוספת LAMA-only (Tiotropium) כ-add-on fourth controller בשלב",
      "Oral steroid 40 מ\"ג/יום × 14 ימים ללא שינוי במשטר maintenance"
    ],
    c: 0,
    c_accept: [0],
    t: "AI-Hard-G",
    st: "Asthma — step-up triggers in SMART (GINA 2023)",
    ti: 3,
    e: "GINA 2023: שימוש תכוף ב-reliever (SABA/low-dose ICS-formoterol) >2–3×/שבוע = אסתמה לא מבוקרת. לפני step-up חייבים לבדוק: adherence, inhaler technique, triggers, comorbidity (rhinitis, GERD). לאחר מכן step-up של maintenance. LAMA (טיוטרופיום) שמור ל-step 5 אחרי ICS/LABA במינון גבוה. Oral steroids רק לאקוטי, לא maintenance. Step-down אחרי 3 חודשים של יציבות. Goroll 8e Ch 48.",
    src: "Goroll 8e — Primary Care Medicine",
    ref: "Goroll 8e Ch 48 — Asthma",
    ref_slug: "asthma-gina-2023"
  },
  {
    q: "גבר בן 62, CAP, CURB-65 = 2 (BUN >7, גיל ≥65). saturation 92% באוויר, hemodynamics יציב, functional at baseline. האשפוז מתבקש?",
    o: [
      "Outpatient — CURB-65 2 עדיין מאפשר טיפול בבית בביטחון",
      "אשפוז מחלקה רגילה — CURB-65 ≥2 = סף ל-admission רגיל",
      "אשפוז ICU — כל CURB-65 ≥2 דורש ניטור מסיבי ומיידי",
      "המתנה עד CURB-65 = 3 שהוא הסף לאשפוז בפועל, לא 2"
    ],
    c: 1,
    c_accept: [1],
    t: "AI-Hard-AFP",
    st: "CAP — CURB-65 admission threshold",
    ti: 3,
    e: "CURB-65 (Confusion / Urea>7 / RR≥30 / BP<90 sys או ≤60 dias / ≥65y): ציון 0–1 = outpatient; 2 = אשפוז מחלקה רגילה (או close-watched outpatient במקרים נבחרים); 3+ = שיקול ICU; 4–5 = ICU. הקריטריון רק orientation-level; שיפוט קליני שוקל comorbidity, תמיכה חברתית, oral intolerance, hypoxia <92%. IDSA/ATS 2019, AFP 2020.",
    src: "AFP — Community-Acquired Pneumonia 2020",
    ref: "AFP 2020 — CAP",
    ref_slug: "cap-idsa-2019"
  },
  {
    q: "גבר בן 56, מעשן 30-pack-year, CT גילה solitary pulmonary nodule solid של 7 מ\"מ, ללא ספיקולציות, ברקע CT נקייה לפני 3 שנים. מה ההמלצה לפי Fleischner 2017?",
    o: [
      "Immediate biopsy — כל nodule במעשן כבד מחייב אבחנה היסטולוגית",
      "CT חוזר ב-6–12 חודשים; אם יציב, עוד CT ב-18–24 חודשים",
      "PET/CT מיידי לכל nodule ≥6 מ\"מ במעשן",
      "אין צורך במעקב — nodule <8 מ\"מ הוא low-risk universally"
    ],
    c: 1,
    c_accept: [1],
    t: "AI-Hard-AFP",
    st: "Pulmonary nodule — Fleischner 2017 for solid 6–8mm high-risk",
    ti: 3,
    e: "Fleischner 2017 עבור solid nodule בחולה high-risk (≥30 pack-year, גיל מבוגר, sex, asbestos/emphysema): 6–8 מ\"מ → CT ב-6–12 חודשים, ואם יציב → CT נוסף ב-18–24 חודשים. <6 מ\"מ high-risk → optional CT ב-12 חודשים. 8+ מ\"מ → שקול PET/CT או biopsy. Biopsy מיידית שמורה ל-≥8 מ\"מ עם high-risk features או תכונות חשודות. האפשרויות \"no follow-up\" ו-\"PET מיידי\" סותרות את הסף של 8 מ\"מ. AFP 2015.",
    src: "AFP — Solitary Pulmonary Nodule 2015",
    ref: "AFP 2015 — Pulmonary Nodule",
    ref_slug: "spn-fleischner-2017"
  }
];

// validate
const issues = [];
newQs.forEach((q, i) => {
  if (!q.q || !q.o || q.o.length !== 4) issues.push(`${i}: missing q/o`);
  if (q.c < 0 || q.c > 3) issues.push(`${i}: bad c`);
  if (!q.c_accept || !q.c_accept.includes(q.c)) issues.push(`${i}: c_accept must include c`);
  if (![3, 9, 24].includes(q.ti)) issues.push(`${i}: ti not in target set`);
  if (!['AI-Hard-G', 'AI-Hard-AFP', 'AI-Hard-N'].includes(q.t)) issues.push(`${i}: bad tag`);
  // correct_longest anti-pattern check
  const lens = q.o.map(o => o.length);
  const maxLen = Math.max(...lens);
  const correctLen = lens[q.c];
  if (correctLen === maxLen && lens.filter(l => l === maxLen).length === 1) {
    // correct option is uniquely longest — anti-pattern
    issues.push(`${i}: correct_longest anti-pattern (correct=${correctLen}, others=${lens.filter((_,j)=>j!==q.c).join(',')})`);
  }
});

if (issues.length) {
  console.error('VALIDATION FAILED:');
  issues.forEach(i => console.error(' -', i));
  process.exit(1);
}

console.log(`Validation passed on ${newQs.length} new Qs.`);

const merged = [...seed, ...newQs];
fs.writeFileSync(seedPath, JSON.stringify(merged, null, 2));

const byTi = {}, byTag = {};
merged.forEach(q => {
  byTi[q.ti] = (byTi[q.ti] || 0) + 1;
  byTag[q.t] = (byTag[q.t] || 0) + 1;
});
console.log(`Seed: ${seed.length} → ${merged.length} (+${newQs.length})`);
console.log('ti 3 :', byTi[3], '(was', seed.filter(q=>q.ti===3).length, ')');
console.log('ti 9 :', byTi[9], '(was', seed.filter(q=>q.ti===9).length, ')');
console.log('ti 24:', byTi[24], '(was', seed.filter(q=>q.ti===24).length, ')');
console.log('By tag:', byTag);
