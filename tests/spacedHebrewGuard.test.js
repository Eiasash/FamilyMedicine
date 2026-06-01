/**
 * Intra-word spaced-Hebrew guard — ported to FamilyMedicine 2026-06-01 (v1.25.10).
 *
 * FM previously had NO spaced-Hebrew guard. A cross-repo audit of the shared detector
 * lineage (Geriatrics PR #320/#321, InternalMedicine #158) found FM also carries the
 * class: a Hebrew word split by spurious PDF/BIDI-extraction spaces. The detector flags:
 *   (a) >=2 consecutive single-Hebrew-letter tokens         — e.g. "ד י ספגיה"→"דיספגיה"
 *   (b) a single prefix letter (ובהלמכש) cleaved from its Hebrew word — "ל תופעות"→"לתופעות"
 *   (c) a lone word-final-form letter (ךםןףץ) standing alone — always a fractured word-end
 *
 * This PR de-spaced the 3 mechanically-safe spans (pure-despace, Hebrew-letter multiset
 * identical, 0 answer-key changes): "ל תופעות"→"לתופעות" (idx319), "כ וח"→"כוח" (idx457),
 * "וחיטו י"→"וחיטוי" (idx469).
 *
 * 4 remain QUARANTINED below — ambiguous, need a source-PDF read (not a mechanical despace):
 *   17  — "ב הוסם ACE": likely a letter error (בחוסם = "with a blocker", ה↔ח), not pure spacing.
 *   254 — "ו ארבעה": ו can be word-final, so forward-glue isn't safe without the source.
 *   565 — "ה ניזון": ה can be a suffix of the preceding word OR the article — ambiguous.
 *   794 — "ש מה": ש prefix vs word-internal — ambiguous.
 * (idx415 "של ר תעודת" is a lone NON-prefix fracture the a/b/c rules don't catch; it is left
 *  for the same source-render follow-up, not allowlisted here since it is not an offender.)
 *
 * RATCHET: any spaced-Hebrew outside the allowlist fails. When a quarantined case is repaired
 * from source, remove its idx from ALLOWLIST in that PR.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');
const QZ = JSON.parse(readFileSync(resolve(ROOT, 'data/questions.json'), 'utf-8'));

const ALLOWLIST = new Set([17, 254, 565, 794]);

const isHeb = (ch) => /[֐-׿]/.test(ch);
const PFX = new Set('ובהלמכש'); // 1-letter Hebrew prefixes — always glued to the next token
const FINAL = /[ךםןףץ]/;       // word-final-form letters — impossible except at word-end
function hasSpacedHebrew(s) {
  const t = String(s).split(/\s+/);
  for (const tok of t) if (tok.length === 1 && FINAL.test(tok)) return true; // (c)
  for (let k = 0; k < t.length - 1; k++) {
    const a = t[k], b = t[k + 1];
    if (a.length === 1 && isHeb(a) && b.length === 1 && isHeb(b)) return true;       // (a)
    if (a.length === 1 && PFX.has(a) && b.length > 0 && isHeb(b[0])) return true;    // (b)
  }
  return false;
}
function fields(q) {
  const out = [q.q || ''];
  for (const o of q.o || []) out.push(String(o));
  return out;
}

describe('intra-word spaced-Hebrew guard (FM)', () => {
  const offenders = [];
  QZ.forEach((q, i) => {
    if (fields(q).some(hasSpacedHebrew)) offenders.push(i);
  });

  it('no NEW spaced-Hebrew corruption (offenders ⊆ allowlist)', () => {
    const unexpected = offenders.filter((i) => !ALLOWLIST.has(i));
    expect(
      unexpected,
      `New spaced-Hebrew corruption at idx ${unexpected.join(', ')}. ` +
        'A Hebrew word was split by spurious spaces — repair the spacing; do not add to the allowlist.'
    ).toEqual([]);
  });

  it('allowlist does not rot — every allowlisted idx still has the artifact', () => {
    const stale = [...ALLOWLIST].filter((i) => !offenders.includes(i));
    expect(stale, `Allowlisted idx ${stale.join(', ')} no longer have spaced-Hebrew — remove from ALLOWLIST.`).toEqual([]);
  });
});
