// App constants — Mishpacha Mega (Family Medicine Shlav A)

export const LS='mishpacha_mega';

// IMA syllabus topic weights (calibrated from 882-Q corpus across 7 sessions)
export const IMA_WEIGHTS=[5,8,2,9,10,11,3,5,8,8,2,2,1,5,2,2,1,1,1,0,1,1,3,1,4,1,3];

// Historical exam topic frequency (absolute counts across 2020, 2021-Jun..2025-Jun)
export const EXAM_FREQ=[43,74,20,86,96,104,25,46,78,79,22,16,12,51,16,19,5,11,8,3,12,7,30,8,39,6,27];

// Past-exam session tokens. Canonical format YYYY-Mon. `2020` bare (month unresolved in source).
export const EXAM_YEARS=['2020','2021-Jun','2022-Jun','2023-Jun','2024-May','2024-Sep','2025-Jun'];

// Supabase (shared Toranot project)
export const SUPA_URL='https://krmlzwwelqvlfslwltol.supabase.co';
export const SUPA_ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtybWx6d3dlbHF2bGZzbHdsdG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NjQxMDksImV4cCI6MjA4NzU0MDEwOX0.PFSuFgHA-WBnrgs4stmloxvOORSX0CiXDPsW2dinAAQ';

// Shared AI proxy (Netlify function on toranot.netlify.app)
export const AI_PROXY='https://toranot.netlify.app/api/claude';
export const AI_SECRET='shlav-a-mega-2026';

// 27 topics for Family Medicine Shlav A (P0062-2025)
// Order follows clinical-workflow clustering (adult → age-group → cross-cutting)
export const TOPICS=[
  'Adult Cardiology — IHD & Arrhythmia',      // 0
  'Heart Failure & Valves',                    // 1
  'Hypertension & Lipids',                     // 2
  'Pulmonology (Asthma, COPD, PE)',            // 3
  'Gastroenterology & Hepatology',             // 4
  'Nephrology, UTI & Urology',                 // 5
  'Endocrinology — Diabetes',                  // 6
  'Endocrinology — Thyroid & Other',           // 7
  'Hematology & Coagulation',                  // 8
  'Rheumatology & Musculoskeletal',            // 9
  'Neurology (Stroke, Headache, Dementia)',    // 10
  'Dermatology',                               // 11
  'Allergy & Immunology',                      // 12
  'Infectious Disease & Vaccines (Adult)',     // 13
  'Women\'s Health & Gynecology',              // 14
  'Pregnancy, Perinatal & Postpartum',         // 15
  'Men\'s Health',                             // 16
  'Geriatrics (Falls, Cognition, Polypharmacy)',// 17
  'Mental Health — Mood, Anxiety, Psychosis',  // 18
  'Addictions & Lifestyle Behaviors',          // 19
  'Preventive Medicine & Health Promotion',    // 20
  'Pain, Palliative & End-of-Life',            // 21
  'Emergencies in the Clinic',                 // 22
  'Peds — Newborn & Development',              // 23
  'Peds — Acute & Infections',                 // 24
  'Peds — Adolescent & Mental Health',         // 25
  'EBM, Communication & Family Systems',       // 26
];

// Version & changelog
export const APP_VERSION='1.2.16';
export const BUILD_HASH='943q-v1.2.16';
export const SYLLABUS_VERSION='P0062-2025';
export const CHANGELOG={
  '1.2.16': [
    '💊 Drugs tab rebuilt for Family Medicine — expanded from 12 geriatric-leaning entries to ~46 FM essentials with pregnancy category (A/B/C/D/X), renal dosing (CrCl cut-offs), and pediatric dosing per row. Color-coded Preg badges, BIDI-safe (dir="auto" + <bdi>).',
    '🧮 Calc tab rebuilt for FM — added BMI, HAS-BLED, CURB-65, Centor/McIsaac, Wells DVT, PHQ-9, GAD-7, HEART. Removed inpatient-only PADUA. Defaults tuned to FM patient (age 60 / wt 70 — was geriatric 75/55).',
    '🎯 Mock Exam upgraded to 150q/3h — matches real שלב א׳ format. By-year mode now pulls up to full 150 from that exam tag. Classic and realistic modes unified, both produce per-topic breakdown.',
    '🔗 Q ↔ Article cross-linking — after revealing an answer in Quiz, related AFP/הר"י articles for that topic appear inline (one tap opens). Article reader footer shows practice past-exam Qs from the same topic.',
    '📅 Daily Contract banner — Quiz tab now opens with a 3-item daily plan: Due reviews (FSRS), Weak drill (rescue pool from weakest topics), Required reading (1 AFP/הר"י article from weakest topic). Deterministic daily pick; resets each calendar day.',
  ],
  '1.2.15': [
    '🔍 Option-level audit pass — Sonnet image-based diff against original 2020 PDF flagged 29 candidate option corrections; 18 applied (clear typo/wording fixes), 11 skipped (Q5 cataract revert hallucinations + length anomalies). Notable real fixes: Q26 runner knee pain options ("בישוב"→"בכיפוף"), Q40 gout aspiration option (was gibberish), Q90 impetigo Tx duration (7→14 days), Q96 lung nodule follow-up interval (6mo→1yr per Fleischner), Q142 breastfeeding evaluation options. ~$0.50.',
  ],
  '1.2.14': [
    '🩺 Spot-check fixes for 2020 Q1-5 — the v1.2.12 stem polish corrupted some option-level details. Fixed: Q1 OSA option text ("יקיצות" instead of "נקיעות"; "ירידת לחץ דם" instead of "ידיעה"). Q2 Glaucoma → restored Hebrew name "ברקית" + fixed "עובי הקרנית" + "פונדוס" typos. Q4 HbA1c → "מהאוכלוסיות" instead of polish-drift "מהמצבים". Q5 cataract → restored 4 distractor ages (21/80/18/48; polish had homogenized to 75/80/50/60) + rewrote explanation to match official c=א.',
  ],
  '1.2.13': [
    '⚖️ EXAM_FREQ + IMA_WEIGHTS recalibrated for the new 943-Q corpus (was tuned for 884 Qs). Notable shifts: Pulm 10→9, GI 11→10, Heme 9→8, Endo-DM 2→3, Women\u05f3s 1→2, EBM 2→3. Readiness/est-score and weakest-topic detection now reflect the real distribution.',
    '🛠️ weekly-audit.yml fix — ti range guard was 0..23 (Pnimit-era) but Mishpacha has 27 topics (0..26); the audit had been silently failing every Sunday on every Q with ti≥24. Also bumped Q-count floor 800→940. CLAUDE.md updated to v1.2.12 state.',
  ],
  '1.2.12': [
    '✨ 2020 stems polished — Sonnet text-pass cleaned residual OCR/reconstruction typos on all 150 Qs (meaning unchanged, readability up). Examples fixed: "בלי\u05f3צו אמא" → "בליווי אמה", "מוחסרת הכרה" → "מחוסרת הכרה". ~$0.40.',
    '🎯 Q21 (16yo teen, confidentiality + school performance drop + depression) re-classified ti 26 → 25 (Peds Adolescent & Mental Health). Topic 25 was empty after initial AI classification; this Q is the textbook case for it.',
  ],
  '1.2.11': [
    '📚 2020 exam re-ingested — from 91 dirty Qs (wrong PDF: was accidentally Internal Medicine 2020) to 150 clean Family Medicine 2020 Shlav A Qs with post-appeal answer key, pre-populated explanations citing Goroll/Nelson/AFP. Total corpus 884 → 943.',
    '🗂️ Nav trimmed — Learn tab removed; Study/Cards/Drugs folded into the More tab alongside Calc/Search/Notes/Chat.',
    '📄 Articles consolidated — one tab now holds AFP reviews, הר"י guidelines, AND the syllabus required-reading list (Appendices ב\'/ג\'/ד\'/ה\'). New "📚 Syllabus" kind filter.',
    '🔤 BIDI overhaul — all AFP/הר"י rendering now uses dir="auto" + unicode-bidi:plaintext so mixed Hebrew/English text (titles, citations, SORT recs, summaries) lays out correctly without flipping.',
    '🔗 Links inside RTL paragraphs wrapped in <bdi> so URLs don\'t hijack paragraph direction.',
  ],
  '1.2.10': [
    '✂️ Harrison tab trimmed from 69 → 42 chapters (41% JSON shrink, 3.97 MB → 2.35 MB). Dropped 27 ICU/inpatient/specialist topics (shock, sepsis, oncologic emergencies, vasculitis, GBS/MG, ICH, encephalitis, IE, osteomyelitis, critical care, sarcoidosis) — Goroll 8e covers what Family Medicine needs at the outpatient level.',
    '🎯 TOPIC_REF rebuilt for FM — was Pnimit-era mapping with wrong chapters per topic (e.g. topic 14 Women\'s Health → Ch 437 Cerebrovascular). Now all 27 FM topics point to the correct primary Goroll 8e chapter.',
    '📖 "Open" button on weakest-topic card now routes to Goroll tab (primary source) instead of Harrison (cross-ref only). Same for Study-Plan chapter open action.',
    '🏷️ BUILD_HASH drift fix — was stuck at \'885q-v1.2.6\' while APP_VERSION advanced through 1.2.7, 1.2.8, 1.2.9. Now tracks with APP_VERSION.',
  ],
  '1.2.9': [
    '🛡️ 10 Pnimit-ported regression guards — catches every ingestion bug we shipped: ð-mojibake, Latin-1 adjacency to Hebrew, Hebrew+digit missing-space, wrong-side ?heb, adjacent-Q fragment bleed, per-tag + cross-tag duplicates, c-vs-explanation drift, stem/option length invariants.',
    '🗑️ Dropped Q[478] (2023-Jun Q133 spirogram, empty options unrecoverable). Fixed residual mojibake in Q[650] (ESAs CKD) explanation missed by reconstruct_mojibake.py.',
    '📉 Count lock: 2023-Jun 148→147, total 885→884.',
  ],
  '1.2.8': [
    '🔤 Reconstructed 191 mojibake Qs (CP1255 ð corruption) across 2024-May + 2024-Sep canonical exams.',
    '🧪 Added 108 tests covering tagMigration, utils, constants, srActivity, suddenDeath (+ coverage analysis workflow).',
    '🛠️ Deploy fix — build.sh hardened against missing optional dist directories (articles/, questions/, syllabus/).',
  ],
  '1.2.7': [
    '🔑 Fixed 114 c-vs-explanation mismatches — defended the official IMA answer key across the canonical 885-Q corpus where parse had drifted.',
  ],
  '1.2.6': [
    '👶 Nelson 22e tab now shows a searchable index of all 165 required chapters (Appendix א\').',
    '🔎 Filter by title or chapter number — useful when cross-referencing a peds topic from Goroll.',
    '📌 Drive link stays prominent (PDF is 167 MB — too big to bundle).',
    '📗 Harrison\'s tab header now flags it as cross-reference only — Goroll 8e is the primary source for P0062-2025.',
    '🛠️ Build fix — scripts/build.sh now copies goroll_chapters.json + nelson_chapters.json into dist/ and caches them in the prod SW (Goroll tab was silently 404ing post-deploy).',
  ],
  '1.2.5': [
    '🐛 Runtime crash fix — close-update-banner wrote to undefined UPDATE_DISMISS_KEY (ReferenceError silently broke the banner). Now routes through exported dismissUpdate() in sw-update.js.',
    '🏷️ Canonical exam tag 2024-Sep everywhere — quiz filter pills, track trend card, engine mock-picker, tagMigration map were all keyed to the non-existent 2024-Oct (produced empty pools).',
    '🔄 tagMigration sentinel bumped V1→V2 so users already migrated with Oct24→2024-Oct get re-remapped to 2024-Sep on next load.',
    '🤖 Dead AI-badge logic fixed — search/quiz cards were checking q.t===\'Harrison\' (never true in this corpus). Switched to q.t===\'AI-Ch\' (the tag actually assigned by library-view addChapterQsToBank).',
    '🇮🇱 CHAT_STARTERS replaced with family-medicine prompts (BP targets, HbA1c, adult vaccines, chest-pain triage, colonoscopy screening, perinatal depression) — were still geriatric (dementia/Beers/frailty/falls).',
    '💬 Chat textarea placeholder: "ברפואה פנימית" → "ברפואת משפחה".',
    '🧬 AI explain + autopsy prompts rewritten for family medicine (were "הרפואה הפנימית" / "Internal medicine board exam").',
    '🔤 Bidi isolation on mixed Hebrew/English strings — unicode-bidi:plaintext + <bdi> (help overlay, chat box, search card previews). English no longer visually flips inside RTL paragraphs.',
    '📣 Help overlay cleanup — Library "פרקי Harrison" → Goroll primary + Nelson + Harrison cross-ref; Articles "10 NEJM/Lancet" → "P0062-2025 required readings"; Quick Start "Library → Harrison" → "Library → Goroll".',
    '🛡️ sanitize() now wraps Q preview text in search cards (defensive, was raw).',
  ],
  '1.2.4': [
    '📄 Articles tab rewired for family medicine — 72 P0062-2025 required readings (Appendix ב/ג/ד/ה).',
    '🇮🇱 56 הר"י Israeli guidelines/position papers 2018-2025 grouped by year.',
    '📚 8 Patient-Centered Care + 7 Family + 9 EBM (JAMA Users\' Guides) articles.',
    '🔗 AFP: dynamic per-topic browsing via aafp.org/afp (link-out, not bundled).',
    '🧹 Branding leaks purged: app header, AI chat system prompt, teach-back rubric, chapter summarizer, quiz-generator, share-app text, syllabus link (P0064→P0062).',
  ],
  '1.2.3': [
    '➕ 3 Qs recovered via parallel pipeline — 882→885 (2022-Jun +1, 2024-May +1, 2024-Sep +1).',
    '🩹 Clinical answer-key corrections for the 3 recovered Qs: Q77 (AST:ALT hepatitis), Q42 (denosumab rebound), Q90 (IPF PFT pattern).',
    '🔒 Per-tag count lock test added — silent re-ingestion drops now fail CI.',
  ],
  '1.2': [
    '📚 882 Qs now in the bank — 7-session corpus (2020 + 2021-Jun through 2025-Jun).',
    '🤖 All Qs AI-classified into 27 topics with Hebrew explanations (Sonnet 4.5).',
    '⚖️ EXAM_FREQ + IMA_WEIGHTS recalibrated from real IMA distribution — readiness score now reflects actual topic weighting.',
    '🎯 Multi-accept answers (c_accept) preserved per IMA appeals across all sessions.',
    '🔄 Parallel ingestion pipeline validated — same pattern as Mishpacha Mega.',
    '📖 3 official reference PDFs bundled: P0062-2025 syllabus, sources list, AHA CPR guidelines.',
  ],
  '1.1': [
    '📝 First 150 Qs ingested — full 2025-Jun IMA exam.',
    '✅ All 150 Qs AI-classified into the 27 topics with Hebrew explanations (Sonnet 4.5).',
    '🎯 10 multi-accept questions preserved via `c_accept` array.',
    '🔧 Parser fix: Hebrew words ending in א/ב/ג/ד no longer false-match as option markers.',
    '🗂️ Exam ingestion pipeline ported from Pnimit (scripts/exam_audit/).',
  ],
  '1.0': [
    '🎉 Mishpacha Mega v1.0 — Family Medicine Shlav A board prep launches.',
    '📚 27 topics covering P0062-2025 syllabus (Goroll 8e + Nelson 22e + AFP + Israeli guidelines).',
    '📄 7 past exam PDFs staged, 800+ gold-standard answer keys extracted.',
    '🎨 Amber/teal skin to visually distinguish from Pnimit (blue) and Geriatrics (teal).',
    '🔗 Shares engine, FSRS, Supabase project, and AI proxy with sibling PWAs.',
  ],
};

// No in-app textbook readers for Family Medicine v1.0 (Goroll/Nelson are external).
// Keep export so existing code references don't break.
export const HARRISON_PDF_MAP={};

// ===== Topic <-> AFP/הר"י specialty cross-link map =====
// Each topic index (0-26) -> array of Hebrew specialty strings matching
// data/afp_hari_index.json. First entry is primary; used for filtering.
// Drives both "related articles on wrong Q" and "drill Qs from article".
export const TOPIC_TO_AFP_SPECS={
  0:['קרדיולוגיה'],
  1:['קרדיולוגיה'],
  2:['קרדיולוגיה','נפרולוגיה, אלקטרוליטים ולחץ-דם'],
  3:['ריאות'],
  4:['גסטרואנטרולוגיה'],
  5:['נפרולוגיה, אלקטרוליטים ולחץ-דם','אורולוגיה'],
  6:['אנדוקרינולוגיה'],
  7:['אנדוקרינולוגיה'],
  8:['המטולוגיה'],
  9:['אורתופדיה','ראומטולוגיה'],
  10:['נוירולוגיה'],
  11:['עור'],
  12:['סוגיות ותסמינים כלליים','תרופות, פרמקולוגיה וטוקסיקולוגיה'],
  13:['מחלות זיהומיות'],
  14:['רפואת נשים'],
  15:['רפואת נשים'],
  16:['אורולוגיה'],
  17:['סוגיות ותסמינים כלליים'],
  18:['פסיכיאטריה'],
  19:['פסיכיאטריה'],
  20:['קידום בריאות ורפואה מונעת'],
  21:['כאב'],
  22:['סוגיות ותסמינים כלליים'],
  23:['רפואת ילדים'],
  24:['רפואת ילדים'],
  25:['רפואת ילדים','פסיכיאטריה'],
  26:['קידום בריאות ורפואה מונעת'],
};

// Inverse map: specialty string -> topic indices (for article -> related Qs).
// Built once at module load.
export const AFP_SPEC_TO_TOPICS=(()=>{const m={};Object.entries(TOPIC_TO_AFP_SPECS).forEach(([ti,specs])=>{specs.forEach(s=>{(m[s]=m[s]||[]).push(+ti);});});return m;})();
