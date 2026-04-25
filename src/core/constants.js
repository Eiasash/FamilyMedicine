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
export const APP_VERSION='1.6.0';
export const BUILD_HASH='1010q-v1.5.0';
export const SYLLABUS_VERSION='P0062-2025';
export const CHANGELOG={
    '1.5.0': [
      '🩺 Content sprint — +60 FM-Core Qs filling 6 syllabus gaps from v1.4.5 audit:',
      '   • Cancer screening (+12, ti=20): mammogram/colono/Pap/PSA/LDCT — IL MOH + USPSTF',
      '   • Vaccines / immunization (+12, ti=13): IL pediatric schedule + adult 65+ + pregnancy + travel + immunosuppressed',
      '   • Contraception (+10, ti=14): LARC, COC absolute CIs (smoking/migraine-aura/VTE), emergency contraception, postpartum, mature minor',
      '   • Adolescent / HEEADSSS (+10, ti=25): confidentiality framework, NSSI vs SI, bulimia, PrEP, IPV in teen dating, gender dysphoria, adolescent depression',
      '   • Family violence (+8, ti=18): IPV with controlling partner, elder abuse mandatory reporting, child abuse Form 223, post-rape protocol',
      '   • STI screening (+8, ti=13): <25 women, MSM 3-site, pregnancy panel, GC treatment per CDC 2020, BV diagnosis, primary syphilis',
      '🏷 t=\'FM-Core\' tag for textbook content (won\'t appear in EXAM_YEARS-filtered pools but available in all-mode + topic-filter)',
      '📊 950 → 1010 Qs (+6.3%); ti=13 IF/Vaccines: 30→50; ti=20 Prev: 29→41; ti=25 Adolescent: 18→28; ti=18 Mental: 24→32',
    ],
  '1.4.5': [
    '🎯 Audit-driven AI-Hard seed expansion +15 Qs (63→78), targeting the three high-weight-low-reference topics flagged in v1.4.4 coverage audit: ti 9 Rheum/MSK (+5, ratio was 4.36), ti 24 Peds-Acute/Infect (+5, ratio 6.25), ti 3 Pulm (+5, ratio 6.50). LBP red flags, knee OA ACR 2019, rotator cuff, gout ULT ACR 2020, RA window, FWS UTI priority, AOM <2y, strep testing, Kawasaki IVIG, infant meningitis empiric Abx, COPD GOLD 2024 ABE, PE Wells, asthma SMART GINA 2023, CAP CURB-65, Fleischner.',
    '🩻 Distractor autopsy gate in extend_seed_v145.mjs — validator rejects any Q where correct option is uniquely longest. Caught 7 anti-patterns on first pass before merge.',
    '📈 Total corpus: 950 base + 78 seed = 1028 Qs (was 1013).',
    '📒 Lerner reader sanity — no changes, still shipped as v1.4.4.',
  ],
  '1.4.4': [
    '📒 Lerner 2025 integrated as 6th Library tab — full 860-page Hebrew "סיכום רפואת המשפחה 2025" (Dr. Nataly Lerner) split into 329 topic-tagged sections (3.58 MB). Searchable, topic-filterable (27-topic taxonomy), inline chapter reader with prev/next + drill-topic button. Adds native Hebrew prose coverage where AFP/הר"י English abstracts were the only non-Q source.',
    '📊 Coverage audit (docs/coverage_audit_v144.md): 0 🚨 ZERO topics, 2 \'ok\' (ti 26 EBM ratio 4.00, ti 9 Rheum/MSK ratio 4.36), 25 ✅ rich. Lerner closed the gap most on HTN/Lipids (+12), GI (+12), Heme (+13), Peds-Newborn (+22).',
    '🏗️ build.sh + sw.js updated to cache lerner_chapters.json as first-class data asset alongside Goroll/Nelson/Harrison chapter indices. Cache bumped mishpacha-v1.4.3 → v1.4.4.',
  ],
  '1.4.3': [
    '🔥 AI-Hard seed expansion 39 → 63 Qs. +16 Nelson-sourced Peds hard MCQs (new AI-Hard-N tag, Chs 13/22/40/50/61/78/84/94/114/137/167/185/225/400/546 — kawasaki, bronchiolitis, DKA, meningitis, Kocher criteria, HSP, JIA, etc). +8 IMA-weighted gap-fill Qs (AF/DOAC, rotator cuff, statin myopathy, HRT window, NNT, PPV, geri pain ladder, GERD alarm features).',
    '🔗 Every AI-Hard Q now carries `ref` (Goroll chapter / AFP article / Nelson chapter) and AFP-tagged Qs also carry `ref_slug` — the UI can deep-link a wrong-answer banner straight to the source article. 63/63 refs populated (was 0/39).',
    '🎯 Track tab: new smart "Drill Your Weakest" card. Composite score = accuracy gap × coverage gap × IMA exam weight — always surfaces the single highest-leverage next topic, even when no single topic is below the 65% Rescue threshold. Cold-start aware: <10 Qs answered → shows 15-Q calibration drill instead of a bogus pick.',
    '🩻 Distractor autopsy v1.4.3: patched 9 Qs (23/25/26/27/28/30/31/32/34) that had the "correct_longest" anti-pattern — distractors rewritten with parity-length plausible clinical detail so option length no longer leaks the answer. 0 anti-pattern findings on the full 63-Q seed.',
    '🛡️ RLS sanity pass on shared Supabase (krmlzwwelqvlfslwltol): all 18 public tables have RLS on. Documented: 3 zero-policy tables are intentional service-role-only (app_config, toranot_config, toranot_patients_backup). P1 finding filed — proxy_rate_limits ALL qual=true public is a rate-limit bypass, cross-repo fix deferred pending Toranot coordination.',
    '📊 Syllabus coverage audit: 1013-Q corpus drifts ≤17% from IMA target on every topic (0 undercovered at 30% threshold). Near-margins to watch: Addictions (ti19 -30%), Thyroid/Mental Health (-17%).',
    '📈 Total corpus: 950 base + 63 seed = 1013 Qs.',
  ],
  '1.4.2': [
    '🔥 AI-Hard seed expansion 32→39 Qs — now covers all 27 topics (was 20/27). Added: HF quad-pillar/ARNI swap (ti 1), BCC Mohs H-zone indication (ti 11), anaphylaxis biphasic monitoring duration (ti 12), BPH combo therapy by gland size (ti 16), AUD naltrexone first-line (ti 19), opioid conversion morphine PO→fentanyl patch (ti 21), NNT from ARR (ti 26). Each with 5+ sentence explanation + structured src field.',
    '🏷️ Back-filled "src" field on all 39 seed Qs — AI-Hard-G → Goroll 8e / AI-Hard-AFP → AFP/הר"י review. Future Q-quality tooling can now filter/cite by source.',
    '📊 Total corpus: 950 base + 39 seed = 989 Qs.',
  ],
  '1.4.1': [
    '📝 Nelson notes: added 20th high-yield chapter — Ch 185 Childhood Asthma (NAEPP/GINA stepwise, SMART, exacerbation ED tiers, action plan). Fixes v1.4.0 CHANGELOG overclaim of "20 chapters" when only 19 shipped.',
  ],
  '1.4.0': [
    '📝 Nelson tab: 20 high-yield chapters now ship with hand-crafted Hebrew board notes (data/nelson_notes.json) — jaundice, pneumonia, AOM, febrile seizure, bronchiolitis/RSV, asthma, DKA, enuresis, UTI, anemia, leukemia, meningitis, strep pharyngitis, Kawasaki, abuse, development milestones, immunization, ADHD, obesity, lead. Inline "📝 הערות" per-row button next to the existing AI Summary / AI Quiz buttons — expands the notes card right under the chapter; ✨ badge flags chapters that have them.',
    '🔥 AI-Hard seed: 32 hard-level Hebrew board MCQs merged at build time into questions.json (base 950 + seed 32 = 982 total). 15 tagged AI-Hard-G (Goroll 8e decision-rule/threshold Qs) + 17 tagged AI-Hard-AFP (AFP SORT-A/B reviews). Quiz tag filter gets two new red-styled pills "🔥 Hard-G" and "🔥 Hard-AFP".',
    '🧰 scripts/gen_ai_hard.mjs — manual LLM generator (claude-sonnet-4-6, Anthropic API) to expand the seed from Goroll chapters + AFP/הר"י articles. Writes to ai_hard_seed.generated.json for human review before merge into ai_hard_seed.json. Not on the build path.',
    '🏗️ build.sh now merges data/ai_hard_seed.json into dist/data/questions.json post-Vite + caches data/nelson_notes.json in sw.js. Source-of-truth questions.json stays clean; seed ships only in the built bundle.',
  ],
  '1.3.4': [
    '🔤 BIDI hygiene pass — .heb class no longer force-sets direction:rtl (was forcing English content to render RTL inside Hebrew-font containers). Now uses unicode-bidi:plaintext + text-align:start, so each paragraph\'s base direction is computed from its own first strong character per the Unicode Bidi Algorithm. Hebrew stays right-aligned, English left-aligns, mixed-majority content renders the way the content dictates.',
    '🔤 Quiz chrome — AI-flag banner, imgDep banner, teach-back textarea, teach-back header span: dir="rtl" → dir="auto" + unicode-bidi:plaintext. Interpolated eFlag text wrapped in <bdi> so English error strings don\'t reorder into surrounding Hebrew.',
  ],
  '1.3.3': [
    '👶 Nelson Library tab now loads like Goroll — 1-tap on a chapter opens the PDF directly (Drive, with #page=N deep-link when a page number is present in nelson_chapters.json). Removed the shell-intermediate reader view; AI Summary (📝) and AI Quiz (🧠) are now small inline per-row buttons, non-blocking. The UI progressively upgrades: if a chapter gets a {file} field it serves from local nelson/, if {page} it Drive-deep-links, else Drive root.',
    '🧹 Dead state removed — G.nelChOpen, open-nel-chapter, close-nel-chapter actions purged along with the auto-AI-summary-on-open workaround (was only needed because the shell had no body text).',
  ],
  '1.3.2': [
    '🔑 Rotated SUPA_ANON from legacy JWT anon to new-format publishable key (sb_publishable_*) — matches § B Toranot, § D Geriatrics, § E Pnimit on the shared Supabase project. Drift-prevention comment added.',
  ],
  '1.3.1': [
    '🔇 DEV-gated 3 console.log leaks (data-loader × 2, sw-update × 1) — no more production console noise on data load / cache cleanup.',
    '🧼 Audit pass clean: 27 topics all ≥3 Qs, 950-Q corpus, BUILD_HASH tracks APP_VERSION, regression guards green.',
  ],
  '1.3.0': [
    '🚨 FORK-BUG REMEDIATION (CRITICAL DATA CORRECTNESS FIX) — Discovered that 5 of 7 exam sessions had been ingested from Internal Medicine PDFs, not Family Medicine, due to copy-paste from the Pnimit fork during initial setup. Affected: 2021-Jun, 2022-Jun, 2023-Jun, 2024-May, 2024-Sep. Users had been studying ~593 Internal Medicine board questions while believing they were Family Medicine.',
    '📚 Re-ingested all 5 polluted sessions from correct FM PDFs via Sonnet-4.5 image-based extraction (~$11, 30 min). Each session anchored on official IMA post-appeal answer key. Result: 800 fresh FM Qs validated, 65 multi-accept correctly captured (incl. 9 invalidated-after-appeal where IMA accepted all 4 options). Net corpus 943 → 950.',
    '✨ 2025-Jun cosmetically refreshed — content was already FM (someone had imported correctly from another source) but PDF was IM. Replaced PDF with the real IMA 2025-Jun FM PDF + re-extracted Qs for stem/option consistency.',
    '⚖️ EXAM_FREQ + IMA_WEIGHTS recalibrated for true 950-Q FM corpus. New shape reflects real FM exam emphasis: Peds-Acute 12% (was 4%), MSK 11% (was 8%), EBM 8% (was 3%), Geriatrics 5%, Women\u05f3s Health 6%. Old weights were tuned on IM-polluted data and would have biased Rescue Drill / weakest-topic detection toward IM topics.',
    '🛡️ Per-session count locks updated: 2021-Jun 149→150, 2022-Jun 147→150, 2023-Jun 147→150 (gained back the dropped Qs), 2025-Jun 150 (refreshed). 2024-May 100, 2024-Sep 100, 2020 150 unchanged.',
    '📂 Replaced 18 PDFs in exams/ with verified FM versions (questions + answers + images + references for each session). All 7 session PDFs now confirmed "רפואת המשפחה" not "רפואה פנימית".',
    '🗝️ Canonical answer keys regenerated for 6 sessions from the new IMA PDFs. Multi-accept and invalidated-after-appeal markers preserved.',
  ],
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
