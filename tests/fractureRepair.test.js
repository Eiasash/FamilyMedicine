/**
 * Intra-word fracture source-render ratchet (v1.25.11).
 *
 * 2 fractures repaired from the source exam-booklet VISUAL renders (the a/b/c spacedHebrewGuard
 * rules don't catch this shape, so these pins guard the fixes against regression):
 *   idx565 "ה ניזון"→"הניזון" — definite participle, glued in the booklet (Q116/2023-Jun); pure-despace.
 *   idx415 "של ר"→"שלך"      — "תעודת מחלה למטופל שלך" (Q116/2022-Jun); render-verified letter reconstruction.
 * Sibling of Geriatrics/InternalMedicine fractureRepair.test.js.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');
const QZ = JSON.parse(readFileSync(resolve(ROOT, 'data/questions.json'), 'utf-8'));

const PINS = [
  [565, 'q', ['הניזון'], ['ה ניזון']],
  [415, 'q', ['למטופל שלך'], []],
];

const fieldText = (q, f) => (f === 'q' ? String(q.q || '') : String((q.o || [])[f] ?? ''));

describe('intra-word fracture source-render ratchet (FM)', () => {
  PINS.forEach(([idx, f, has, absent]) => {
    it(`idx ${idx} field ${f}: repaired`, () => {
      const s = fieldText(QZ[idx], f);
      for (const w of has) expect(s, `expected "${w}" in idx ${idx}`).toContain(w);
      for (const w of absent) expect(s, `old fracture "${w}" should be gone in idx ${idx}`).not.toContain(w);
    });
  });

  it('count unchanged (1121)', () => {
    expect(QZ.length).toBe(1121);
  });
});
