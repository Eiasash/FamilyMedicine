// App constants — Mishpacha Mega (Family Medicine Shlav A)

export const LS='mishpacha_mega';

// IMA syllabus topic weights (calibrated from 950-Q corpus across 7 FM sessions, v1.3.0)
export const IMA_WEIGHTS=[2,1,3,4,4,3,3,3,3,11,4,2,1,3,6,4,1,5,3,1,3,1,4,3,12,2,8];

// Historical exam topic frequency (absolute counts across 2020 + 2021-Jun..2025-Jun, all confirmed Family Medicine, v1.3.0)
export const EXAM_FREQ=[20,13,29,38,41,27,31,24,28,100,41,22,11,30,58,42,9,46,24,6,29,10,39,24,115,18,75];

// Past-exam session tokens. Canonical format YYYY-Mon. `2020` bare (month unresolved in source).
export const EXAM_YEARS=['2020','2021-Jun','2022-Jun','2023-Jun','2024-May','2024-Sep','2025-Jun'];

// Supabase (shared Toranot project — shared w/ Geriatrics / Pnimit / Toranot)
// DO NOT drift: the URL + key here must match Geriatrics/shlav-a-mega.html and InternalMedicine/src/core/constants.js.
// New-format publishable key (sb_publishable_*) — public client key by design, safe to ship.
// Legacy JWT anon rotated out 2026-04 (matches § B/D on same project).
export const SUPA_URL='https://krmlzwwelqvlfslwltol.supabase.co';
export const SUPA_ANON='sb_publishable_tUuqQQ8RKMvLDwTz5cKkOg_o_y-rHtw';

// Shared AI proxy (Netlify function on toranot.netlify.app)
export const AI_PROXY='https://toranot.netlify.app/api/claude';
// P0 cutover (runbook §3): the shared proxy x-api-secret was removed from the
// client bundle. The proxy is now authenticated with a Supabase session JWT —
// see getProxyBearer() in src/services/supabaseAuth.js.

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
export const APP_VERSION='1.26.20';
export const BUILD_HASH='1271q-v1.26.20';
export const SYLLABUS_VERSION='P0062-2025';
// CHANGELOG moved to ./changelog.js for code-splitting. Dynamically
// imported in showHelp() so the ~69KB raw / ~30KB gzipped doesn't load
// in the critical path.

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
  4:['גסטרואנטרולוגיה','כירורגיה'],
  5:['נפרולוגיה, אלקטרוליטים ולחץ-דם','אורולוגיה'],
  6:['אנדוקרינולוגיה','עיניים'],
  7:['אנדוקרינולוגיה'],
  8:['המטולוגיה','אונקולוגיה'],
  9:['אורתופדיה','ראומטולוגיה'],
  10:['נוירולוגיה'],
  11:['עור'],
  12:['סוגיות ותסמינים כלליים','תרופות, פרמקולוגיה וטוקסיקולוגיה','אא_ג, רפואת הפה והשיניים'],
  13:['מחלות זיהומיות','אא_ג, רפואת הפה והשיניים'],
  14:['רפואת נשים','אונקולוגיה'],
  15:['רפואת נשים'],
  16:['אורולוגיה','אונקולוגיה'],
  17:['סוגיות ותסמינים כלליים'],
  18:['פסיכיאטריה'],
  19:['פסיכיאטריה'],
  20:['קידום בריאות ורפואה מונעת','אונקולוגיה'],
  21:['כאב'],
  22:['סוגיות ותסמינים כלליים','כירורגיה','עיניים','אא_ג, רפואת הפה והשיניים'],
  23:['רפואת ילדים'],
  24:['רפואת ילדים','אא_ג, רפואת הפה והשיניים'],
  25:['רפואת ילדים','פסיכיאטריה'],
  26:['קידום בריאות ורפואה מונעת'],
};

// Inverse map: specialty string -> topic indices (for article -> related Qs).
// Built once at module load.
export const AFP_SPEC_TO_TOPICS=(()=>{const m={};Object.entries(TOPIC_TO_AFP_SPECS).forEach(([ti,specs])=>{specs.forEach(s=>{(m[s]=m[s]||[]).push(+ti);});});return m;})();
