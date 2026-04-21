// App constants — Mishpacha Mega (Family Medicine Shlav A)

export const LS='mishpacha_mega';

// IMA syllabus topic weights (preliminary — to be recalibrated from ingested exam tags)
// 27 topics, P0062-2025 (Family Medicine). Weights are rough %, will be refined post-ingestion.
export const IMA_WEIGHTS=[5,4,4,5,4,4,3,3,4,4,5,4,4,3,4,5,3,6,4,4,3,4,4,3,3,3,4];

// Historical exam topic frequency (placeholder — calibrate after ingestion)
export const EXAM_FREQ=[25,20,20,25,20,20,15,15,20,20,25,20,20,15,20,25,15,30,20,20,15,20,20,15,15,15,20];

// Past-exam session tokens. Canonical format YYYY-Mon. `2020` bare (month unresolved in source).
export const EXAM_YEARS=['2020','2021-Jun','2022-Jun','2023-Jun','2024-May','2024-Sep','2025-Jun'];

// Supabase (shared Toranot project)
export const SUPA_URL='https://krmlzwwelqvlfslwltol.supabase.co';
export const SUPA_ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtybWx6d3dlbHF2bGZzbHdsdG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NjQxMDksImV4cCI6MjA4NzU0MDEwOX0.PFSuFgHA-WBnrgs4stmloxvOORSX0CiXDPsW2dinAAQ';

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
export const APP_VERSION='1.1';
export const CHANGELOG={
  '1.1': [
    '📝 First 150 Qs ingested — full 2025-Jun IMA exam (June 12, 2025 session).',
    '✅ All 150 Qs AI-classified into the 27 topics with Hebrew explanations (Sonnet 4.5).',
    '🎯 10 multi-accept questions preserved via `c_accept` array (matches IMA appeals).',
    '📚 3 official reference PDFs bundled under docs/references/: syllabus, sources list, AHA CPR guidelines.',
    '🔧 Parser fix: Hebrew words ending in א/ב/ג/ד (e.g., בריא) no longer false-match as option markers.',
    '🗂️ Exam ingestion pipeline ported from Pnimit (scripts/exam_audit/).',
  ],
  '1.0': [
    '🎉 Mishpacha Mega v1.0 — Family Medicine Shlav A board prep launches.',
    '📚 27 topics covering P0062-2025 syllabus (Goroll 8e + Nelson 22e + AFP + Israeli guidelines).',
    '📄 7 past exam PDFs staged (2020 + 2021-Jun through 2025-Jun), 800+ gold-standard answer keys extracted.',
    '⏳ Question ingestion pending — v1.x series will ramp from 0 → ~900 Qs as past exams are OCR\'d.',
    '🎨 Amber/teal skin to visually distinguish from Pnimit (blue) and Geriatrics (teal).',
    '🔗 Shares engine, FSRS, Supabase project, and AI proxy with sibling PWAs.',
  ],
};

// No in-app textbook readers for Family Medicine v1.0 (Goroll/Nelson are external).
// Keep export so existing code references don't break.
export const HARRISON_PDF_MAP={};
