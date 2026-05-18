/**
 * Harrison citation guards — pin Harrison Ch references in data/questions.json
 * to the canonical 22e Table of Contents (505 chapters).
 *
 * Mirrors the Geriatrics PR #146-151 audit pattern that found 4 transposition
 * bugs (Ch 311→321, 365→384, 126→131, 24→23) by combining bound-check,
 * dict-membership, and title-token-match.
 *
 * FM uses Harrison only as a cross-reference (per CLAUDE.md "Clinical knowledge
 * hierarchy"); primary sources are Goroll 8e + Nelson 22e + AFP. So the guard
 * is mostly about *future* drift — currently FM has 0 Harrison citations, but
 * the rules prevent regressions when content is ported from sibling repos.
 *
 * Stopword list matches the Geri audit so token overlap behaves identically.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');

// Hebrew niqqud range to strip before tokenization
const NIQQUD = /[֑-ׇ]/g;

const STOPWORDS = new Set([
  'with','this','that','from','have','been','more','most','when','what',
  'some','than','only','also','each','about','into','over','such','very',
  'other','their','these','those','which','where','will','shall',
  'disease','approach','patient','syndromes','syndrome',
]);

function normalize(s) {
  if (!s) return '';
  return s.replace(NIQQUD, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function strongTokens(s) {
  if (!s) return new Set();
  const n = normalize(s);
  // Latin and Hebrew letters, length>=4, with stopwords filtered
  const out = new Set();
  for (const m of n.matchAll(/[A-Za-z֐-׿]{4,}/g)) {
    const t = m[0];
    if (!STOPWORDS.has(t)) out.add(t);
  }
  return out;
}

const HR_TITLED = /Harrison\s*Ch\s*(\d+)\s*(?:[—–-]|\()\s*([^·\n)]{3,150}?)\s*(?:[·\n)]|$)/gi;
const HR_ANY = /Harrison\s*Ch\s*(\d+)/gi;

describe('Harrison citation guards (data/questions.json)', () => {
  let questions, harrison;
  beforeAll(() => {
    questions = JSON.parse(readFileSync(resolve(ROOT, 'data/questions.json'), 'utf-8'));
    harrison = JSON.parse(readFileSync(resolve(ROOT, 'data/harrison_22e_toc.json'), 'utf-8'));
  });

  it('canonical TOC parses with at least 500 chapters (22e ships 505)', () => {
    expect(typeof harrison).toBe('object');
    expect(Array.isArray(harrison)).toBe(false);
    expect(Object.keys(harrison).length).toBeGreaterThanOrEqual(500);
  });

  it('every Harrison Ch citation is <= 505 (bound check)', () => {
    const out = [];
    questions.forEach((q, i) => {
      for (const field of ['ref', 'e']) {
        const v = q[field] || '';
        for (const m of v.matchAll(HR_ANY)) {
          const n = parseInt(m[1], 10);
          if (n > 505) out.push({ idx: i, field, chapter: n });
        }
      }
    });
    expect(out, `Harrison Ch >505 found: ${JSON.stringify(out.slice(0, 5))}`).toEqual([]);
  });

  it('every Harrison Ch citation is a key in harrison_22e_toc.json (dict-membership)', () => {
    const out = [];
    questions.forEach((q, i) => {
      for (const field of ['ref', 'e']) {
        const v = q[field] || '';
        for (const m of v.matchAll(HR_ANY)) {
          const n = parseInt(m[1], 10);
          if (n > 505) continue; // already covered by bound check
          if (!Object.prototype.hasOwnProperty.call(harrison, String(n))) {
            out.push({ idx: i, field, chapter: n });
          }
        }
      }
    });
    expect(out, `Harrison Ch not in TOC: ${JSON.stringify(out.slice(0, 5))}`).toEqual([]);
  });

  it('every titled Harrison citation shares >=1 strong token with canonical title', () => {
    const out = [];
    questions.forEach((q, i) => {
      for (const field of ['ref', 'e']) {
        const v = q[field] || '';
        for (const m of v.matchAll(HR_TITLED)) {
          const n = parseInt(m[1], 10);
          if (!Object.prototype.hasOwnProperty.call(harrison, String(n))) continue;
          const cited = (m[2] || '').trim().replace(/[*—–-]+$/, '').trim();
          if (cited.length < 3) continue;
          const canonEntry = harrison[String(n)];
          const canon = (canonEntry && typeof canonEntry === 'object' && canonEntry.title) || String(canonEntry || '');
          const cT = strongTokens(cited);
          const kT = strongTokens(canon);
          if (cT.size && kT.size) {
            const overlap = [...cT].some((t) => kT.has(t));
            if (!overlap) out.push({ idx: i, field, chapter: n, cited: cited.slice(0, 60), canonical: canon.slice(0, 60) });
          }
        }
      }
    });
    expect(out, `Harrison title mismatches: ${JSON.stringify(out.slice(0, 5))}`).toEqual([]);
  });

  it('same Harrison Ch never cited with semantically different titles (self-consistency)', () => {
    const map = new Map();
    questions.forEach((q, i) => {
      for (const field of ['ref', 'e']) {
        const v = q[field] || '';
        for (const m of v.matchAll(HR_TITLED)) {
          const n = parseInt(m[1], 10);
          const t = (m[2] || '').trim().replace(/[*—–-]+$/, '').trim();
          if (t.length < 3) continue;
          if (!map.has(n)) map.set(n, []);
          map.get(n).push({ idx: i, field, title: t });
        }
      }
    });
    const disagreements = [];
    for (const [ch, recs] of map.entries()) {
      const groups = new Map();
      for (const r of recs) {
        const key = normalize(r.title);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(r);
      }
      if (groups.size > 1) disagreements.push({ chapter: ch, distinct: groups.size });
    }
    expect(disagreements, `Self-disagreements: ${JSON.stringify(disagreements.slice(0, 5))}`).toEqual([]);
  });
});
