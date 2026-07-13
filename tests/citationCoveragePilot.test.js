/**
 * Citation backfill pilot — v1.21.22 — pins 16 verified HTN/Lipid Q citations.
 *
 * Each entry below was anchor-verified against the locally extracted Goroll 8e
 * PDF text BEFORE the citation was appended (see
 * .audit_logs/fm_citation_backfill_pilot_2026-05-10.md for the per-Q anchor evidence
 * and the verbatim chapter text that defends each cite).
 *
 * If any of these explanations regress (citation removed, replaced, or
 * pre-existing q.e content modified) this test fails. It does NOT enforce
 * citations on any other Q — it's a pin, not a coverage gate.
 *
 * Why no general "min total citations" assertion: existing citation phrasing
 * is heterogeneous ("מקור: ...", "התשובה מבוססת על ...", "AAFP ו-..."). Pinning
 * by content keyword would over- or under-count depending on regex choice.
 * The deliberate choice is: pin the EXACT 16 we shipped, let future batches
 * extend this file with their own pinned positions.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const QS_PATH = path.resolve(__dirname, '..', 'data', 'questions.json');
const QS = JSON.parse(fs.readFileSync(QS_PATH, 'utf-8'));

// pos -> expected Goroll chapter number (must appear in q.e tail)
const PILOT_CITATIONS = {
  // Ch 26 — Management of Hypertension
  46:  26,
  76:  26,
  183: 26,
  259: 26,
  394: 26,
  404: 26,
  457: 26,
  567: 26,
  673: 26,
  715: 26,
  725: 26,
  941: 26,
  // Ch 19 — Evaluation of Hypertension
  94:  19,
  544: 19,
  745: 19,
  816: 19,
};

describe('FM v1.21.22 Goroll citation pilot (16 HTN/Lipid Qs)', () => {
  it('corpus size is 1271 (v1.25.0 baseline 1121 + 150 for 2026-Jun; append-only, pilot indices unshifted)', () => {
    expect(QS).toHaveLength(1271);
  });

  for (const [posStr, ch] of Object.entries(PILOT_CITATIONS)) {
    const pos = Number(posStr);
    it(`pos=${pos} cites Goroll פרק ${ch} at q.e tail`, () => {
      const q = QS[pos];
      expect(q, `Q at pos=${pos} missing`).toBeDefined();
      const e = (q.e || '').trim();
      // Must end with our exact pilot suffix. Other phrasings (התשובה מבוססת על)
      // are deliberately NOT accepted here — this pins the v1.21.22 batch literal.
      expect(e, `pos=${pos} q.e empty`).not.toBe('');
      expect(e).toMatch(new RegExp(`מקור: Goroll 8e פרק ${ch}\\.$`));
      // ti must be 2 (Hypertension & Lipids) for every pilot Q — sanity that we
      // didn't accidentally pin a wrong index after a corpus reorder
      expect(q.ti, `pos=${pos} ti drifted`).toBe(2);
    });
  }

  it('Goroll-8e citation count is at least 16 (pilot floor)', () => {
    // v1.21.21 baseline: 0 instances of the literal "Goroll 8e פרק N."
    // pattern (existing citations used "גורול פרק N", "Goroll פרק N",
    // "מקור: גורול מהדורה 7" etc — no "8e" form). Pilot adds 16.
    // Allow >= so future hand-additions don't churn this test, but fail
    // if the pilot batch silently disappears.
    const re = /Goroll 8e פרק \d+\./g;
    let total = 0;
    for (const q of QS) {
      const e = q.e || '';
      const matches = e.match(re);
      if (matches) total += matches.length;
    }
    expect(total).toBeGreaterThanOrEqual(16);
  });
});

// ============================================================================
// v1.21.23 — Diabetes batch (27 ti=6 Qs cite Goroll 8e Ch 102 + Ch 93)
// Each entry was anchor-verified against locally extracted Goroll Ch 102
// (pp 2893-2992, "Approach to the Patient with Diabetes Mellitus") and
// Ch 93 (pp 2742-2769, "Screening for Type 2 Diabetes Mellitus") BEFORE
// the cite was appended. 4 of the 31 ti=6 uncited Qs were SKIPPED — see
// commit message + .audit_logs/fm_citation_backfill_dm_2026-05-10.md
// for the per-Q anchor evidence and skip rationales.
// ============================================================================
const DM_BATCH_CITATIONS = {
  // Ch 93 — Screening / Diagnostic criteria / Prediabetes prevention
  3:   93, // HbA1c diagnostic limitations + pregnancy
  13:  93, // lifestyle vs metformin for DM2 prevention (DPP)
  223: 93, // ADA screening criteria BMI≥25 + risk factor
  308: 93, // OGTT 75g most sensitive when FPG/A1c discordant
  464: 93, // DM diagnostic criteria — fasting glucose ≥126 confirmation
  555: 93, // Metformin for prediabetes — high-risk criteria
  // Ch 102 — DM management / complications / drug selection
  53:  102, // DPP-4 (Linagliptin) in eGFR=20
  83:  102, // NPDR + LDL target / focal laser
  118: 102, // gastroparesis Dx
  151: 102, // T1DM retinopathy screening at 5y
  158: 102, // adult-onset autoimmune DM (LADA pattern) — C-peptide low + AAB high
  212: 102, // smoking + retinopathy risk
  243: 102, // SGLT2i added in CKD3a + uncontrolled DM
  338: 102, // stop metformin in CKD3b, switch to GLP-1RA
  340: 102, // retinopathy course T1 vs T2
  368: 102, // HFrEF + DM → SGLT2i (DAPA-HF)
  538: 102, // NPDR + DME → anti-VEGF
  592: 102, // PDR features (vitreous hemorrhage, macular edema)
  602: 102, // Sitagliptin renal dose adjustment
  630: 102, // stop glibenclamide in elderly + low HbA1c
  670: 102, // HF + AKI + hyperglycemia → insulin
  700: 102, // pancreatitis + MEN history → avoid GLP-1
  788: 102, // retinopathy course (duplicate-Q of 340)
  800: 102, // T1DM islet autoantibodies
  820: 102, // stop glibenclamide in CKD3b
  843: 102, // retinopathy course (duplicate-Q of 340)
  846: 102, // MODY (maturity-onset diabetes of the young)
};

describe('FM v1.21.23 Goroll DM citation batch (27 ti=6 Qs)', () => {
  for (const [posStr, ch] of Object.entries(DM_BATCH_CITATIONS)) {
    const pos = Number(posStr);
    it(`pos=${pos} cites Goroll פרק ${ch} at q.e tail (DM batch)`, () => {
      const q = QS[pos];
      expect(q, `Q at pos=${pos} missing`).toBeDefined();
      const e = (q.e || '').trim();
      expect(e, `pos=${pos} q.e empty`).not.toBe('');
      expect(e).toMatch(new RegExp(`מקור: Goroll 8e פרק ${ch}\\.$`));
      // ti must be 6 (Diabetes) for every DM-batch Q
      expect(q.ti, `pos=${pos} ti drifted`).toBe(6);
    });
  }

  it('Goroll-8e citation count is at least 43 (cumulative pilot+DM floor)', () => {
    // v1.21.22 floor was 16; DM batch adds 27 → total ≥ 43.
    const re = /Goroll 8e פרק \d+\./g;
    let total = 0;
    for (const q of QS) {
      const e = q.e || '';
      const matches = e.match(re);
      if (matches) total += matches.length;
    }
    expect(total).toBeGreaterThanOrEqual(43);
  });

  it('Ch 93 citation count is exactly 6 (DM screening sub-batch)', () => {
    const re = /מקור: Goroll 8e פרק 93\.$/;
    let count = 0;
    for (const q of QS) {
      if (re.test((q.e || '').trim())) count++;
    }
    expect(count).toBe(6);
  });
});

// ============================================================================
// v1.21.24 — Lerner ti=26 batch (32 EBM/Communication/Family-Systems Qs)
//
// First non-Goroll batch — Goroll 8e doesn't cover ti=26 per the pilot doc.
// Pivots to the locally-staged Israeli FM textbook: ד"ר נטלי לרנר,
// Family Medicine Summary, 2025, 860pp, indexed in lerner_chapters.json.
// 8 Lerner chapters carry ti=26 natively.
//
// Subagent-driven matching (proposal at
// .audit_logs/legal_policy_2026-05-10/lerner_ti26_proposal.json) classified
// each Q's sub-topic and required ≥3 distinctive Hebrew/English anchors AND
// sub-topic-correct chapter pick for HIGH confidence; only HIGH shipped here.
// 32 MEDIUM proposals NOT shipped (need per-Q hand review).
//
// Format: `מקור: לרנר 2025 — "<chapter title>".`
// ============================================================================
const LERNER_TI26_BATCH = {
  // chap 306 — חוק ואתיקה (law/ethics: involuntary commitment, informed
  // consent, confidentiality, ועדת אתיקה, מיופה כח, mandatory reporting)
  11:  'חוק ואתיקה',
  21:  'חוק ואתיקה',
  71:  'חוק ואתיקה',
  279: 'חוק ואתיקה',
  389: 'חוק ואתיקה',
  460: 'חוק ואתיקה',
  480: 'חוק ואתיקה',
  510: 'חוק ואתיקה',
  550: 'חוק ואתיקה',
  589: 'חוק ואתיקה',
  708: 'חוק ואתיקה',
  810: 'חוק ואתיקה',
  948: 'חוק ואתיקה',
  // chap 316 — הערכת תקפות מחקרים (study-validity: RR/HR/CI, Case-Control,
  // selection bias, ITT, generalizability)
  87:  'הערכת תקפות מחקרים',
  261: 'הערכת תקפות מחקרים',
  298: 'הערכת תקפות מחקרים',
  424: 'הערכת תקפות מחקרים',
  435: 'הערכת תקפות מחקרים',
  466: 'הערכת תקפות מחקרים',
  496: 'הערכת תקפות מחקרים',
  517: 'הערכת תקפות מחקרים',
  699: 'הערכת תקפות מחקרים',
  762: 'הערכת תקפות מחקרים',
  923: 'הערכת תקפות מחקרים',
  // chap 317 — ניתוח בדיקות אבחנתיות (sens/spec/PPV/NPV, ROC, screening
  // test interpretation, Bayesian post-test probability)
  139: 'ניתוח בדיקות אבחנתיות',
  910: 'ניתוח בדיקות אבחנתיות',
  // chap 318 — ניסויים קליניים (RCT design, blinding, randomization,
  // intention-to-treat)
  530: 'ניסויים קליניים',
  712: 'ניסויים קליניים',
  // chap 320 — משפחה והיבטים פסיכוסוציאליים (Minuchin, SCREEEM,
  // family-lifecycle, psychosocial models)
  70:  'משפחה והיבטים פסיכוסוציאליים',
  144: 'משפחה והיבטים פסיכוסוציאליים',
  254: 'משפחה והיבטים פסיכוסוציאליים',
  // chap 326 — BATHE (interview structure for life-events / psychosocial
  // probing in primary care)
  499: '– BATHEתחקור והתייחסות למאורעות חיים בשיח הרפואי',
};

describe('FM v1.21.24 Lerner ti=26 citation batch (32 EBM/law/family Qs)', () => {
  for (const [posStr, title] of Object.entries(LERNER_TI26_BATCH)) {
    const pos = Number(posStr);
    it(`pos=${pos} cites Lerner "${title}" at q.e tail (ti=26 batch)`, () => {
      const q = QS[pos];
      expect(q, `Q at pos=${pos} missing`).toBeDefined();
      const e = (q.e || '').trim();
      expect(e, `pos=${pos} q.e empty`).not.toBe('');
      // Escape regex meta-chars in the Hebrew title
      const titleEsc = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      expect(e).toMatch(new RegExp(`מקור: לרנר 2025 — "${titleEsc}"\\.$`));
      // ti must be 26 for every Lerner-batch Q
      expect(q.ti, `pos=${pos} ti drifted`).toBe(26);
    });
  }

  it('Lerner-2025 citation count is at least 32 (Lerner-batch floor)', () => {
    // v1.21.23 baseline: 0 instances of "מקור: לרנר 2025" pattern.
    // Lerner batch adds 32. Allow >= so future hand-additions don't churn.
    const re = /מקור: לרנר 2025 — "[^"]+"\./g;
    let total = 0;
    for (const q of QS) {
      const e = q.e || '';
      const matches = e.match(re);
      if (matches) total += matches.length;
    }
    expect(total).toBeGreaterThanOrEqual(32);
  });

  it('cumulative cited-Q count is at least 93 (pilot+DM+Lerner+MentalHealth floor)', () => {
    // v1.21.22 (16 Goroll HTN/Lipid) + v1.21.23 (27 Goroll DM) +
    // v1.21.24 (32 Lerner ti=26) + v1.21.25 (18 Goroll Mental Health) = 93.
    // Allow >= so future batches extend.
    const reGoroll = /מקור: Goroll 8e פרק \d+\./g;
    const reLerner = /מקור: לרנר 2025 — "[^"]+"\./g;
    let total = 0;
    for (const q of QS) {
      const e = q.e || '';
      const g = e.match(reGoroll);
      const l = e.match(reLerner);
      if (g) total += g.length;
      if (l) total += l.length;
    }
    expect(total).toBeGreaterThanOrEqual(93);
  });

  it('chap 306 (חוק ואתיקה) citation count is exactly 13 (law/ethics sub-batch)', () => {
    const re = /מקור: לרנר 2025 — "חוק ואתיקה"\.$/;
    let count = 0;
    for (const q of QS) {
      if (re.test((q.e || '').trim())) count++;
    }
    expect(count).toBe(13);
  });

  it('chap 316 (הערכת תקפות מחקרים) citation count is exactly 11 (EBM-validity sub-batch)', () => {
    const re = /מקור: לרנר 2025 — "הערכת תקפות מחקרים"\.$/;
    let count = 0;
    for (const q of QS) {
      if (re.test((q.e || '').trim())) count++;
    }
    expect(count).toBe(11);
  });
});

// ============================================================================
// v1.21.25 — Mental Health batch (19 ti=18 Qs cite Goroll 8e Section XV)
// Each entry was anchor-verified against locally extracted Goroll Ch 226-235
// (Section XV — Psychiatric and Behavioral Problems, pp 5354-5734) BEFORE
// the cite was appended. ≥2 distinct anchor hits required for any cite.
// 13 of the 32 ti=18 uncited Qs were SKIPPED for this batch — 7 are Israeli
// psychiatric-law specific (involuntary admission, ועדת בדיקה כפויה), 5 are
// FM-Core IPV/abuse Qs that need Israeli law sources, 1 (pos=54 chronic
// fatigue syndrome) is outside Section XV. Those will be a future Lerner
// batch. See commit message for the per-Q anchor evidence.
// ============================================================================
const MENTAL_HEALTH_BATCH = {
  // Ch 226 — Approach to the Patient with Anxiety
  170: 226, // adjustment disorder + retirement stressor
  812: 226, // PTSD delayed onset
  863: 226, // panic attack symptomatology
  // Ch 227 — Approach to the Patient with Depression
  63:  227, // suicide risk epidemiology
  262: 227, // bipolar disorder pharmacotherapy (lithium/valproate)
  // pos=339 (LGBT-suicide-risk Q) deliberately NOT pinned: Ch 227's 322
  // raw "suicide"+"depression" hits were saturation on chapter-wide
  // common terms, not actual LGBT/sexual-minority content. Deferred to
  // a future Lerner / AFP batch.
  502: 227, // PHQ-2 / PHQ-9 depression screening
  594: 227, // suicide prevention + safety planning (no-suicide contract not effective)
  612: 227, // SSRI sexual dysfunction profile
  616: 227, // adjustment disorder with depressed mood
  791: 227, // SSRI cardiovascular safety (vs venlafaxine)
  798: 227, // lithium monitoring (renal + thyroid)
  832: 227, // lithium-thiazide-NSAID interactions
  885: 227, // duloxetine for depression + neuropathic pain
  // Ch 230 — Approach to the Patient with Somatic Symptom Disorder
  772: 230, // factitious disorder (insulin self-injection)
  // Ch 232 — Approach to the Patient with Insomnia
  666: 232, // delayed sleep phase + sleep hygiene
  826: 232, // chronic insomnia + CBT-I stimulus control
  // Ch 233 — Approach to Eating Disorders
  352: 233, // anorexia nervosa workup (prolactin/FSH/LH)
  468: 233, // anorexia nervosa hospitalization criteria
};

describe('FM v1.21.25 Goroll Mental Health citation batch (18 ti=18 Qs)', () => {
  for (const [posStr, ch] of Object.entries(MENTAL_HEALTH_BATCH)) {
    const pos = Number(posStr);
    it(`pos=${pos} cites Goroll פרק ${ch} at q.e tail (Mental Health batch)`, () => {
      const q = QS[pos];
      expect(q, `Q at pos=${pos} missing`).toBeDefined();
      const e = (q.e || '').trim();
      expect(e, `pos=${pos} q.e empty`).not.toBe('');
      expect(e).toMatch(new RegExp(`מקור: Goroll 8e פרק ${ch}\\.$`));
      // ti must be 18 (Mental Health) for every Mental-Health-batch Q
      expect(q.ti, `pos=${pos} ti drifted`).toBe(18);
    });
  }

  it('Goroll-8e citation count is at least 61 (cumulative pilot+DM+MentalHealth floor)', () => {
    // v1.21.23 floor was 43 Goroll cites; Mental Health batch adds 18 → ≥ 61.
    const re = /Goroll 8e פרק \d+\./g;
    let total = 0;
    for (const q of QS) {
      const e = q.e || '';
      const matches = e.match(re);
      if (matches) total += matches.length;
    }
    expect(total).toBeGreaterThanOrEqual(61);
  });

  it('Ch 227 citation count is at least 10 (Depression sub-batch floor)', () => {
    // 10 Mental Health Qs cite Ch 227 (was 11 before pos=339 dropped).
    // Allow >= so future batches extend.
    const re = /מקור: Goroll 8e פרק 227\.$/;
    let count = 0;
    for (const q of QS) {
      if (re.test((q.e || '').trim())) count++;
    }
    expect(count).toBeGreaterThanOrEqual(10);
  });
});
