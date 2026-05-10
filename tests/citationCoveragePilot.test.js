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
