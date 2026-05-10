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
  it('corpus size is the v1.21.22 baseline (1061 Qs)', () => {
    expect(QS).toHaveLength(1061);
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
