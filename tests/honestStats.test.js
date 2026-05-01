/**
 * Honest stats — CI guard against scoring functions returning confident-looking
 * numbers when fed sparse or empty state.
 *
 * This whole class of bug is what produced the v1.17.0 fix:
 *   - Topic Heatmap showed high mastery on freshly-failed cards because the
 *     formula used FSRS R only (R≈1 right after any review, right or wrong).
 *   - Est. Score showed 60% because topics with <3 answers were imputed
 *     acc=0.60 — making the score collapse to ~60% on sparse data.
 *
 * Principle codified here: if data is too sparse for a real measurement, the
 * scoring function MUST return null (UI shows "—") rather than a default
 * value that looks like a measurement.
 *
 * Mirrors Pnimit's tests/honestStats.test.js. Adding a new scoring function?
 * Add a case here AND in the sibling repos (Pnimit + Geri).
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

globalThis.window = globalThis;

const fsrsSrc = readFileSync(resolve(process.cwd(), 'shared', 'fsrs.js'), 'utf-8');
const seed = new Function(
  'target',
  fsrsSrc +
    ';Object.assign(target, { FSRS_W, FSRS_DECAY, FSRS_FACTOR, FSRS_RETENTION,' +
    ' fsrsR, fsrsInterval, fsrsInitNew, fsrsUpdate, fsrsMigrateFromSM2, isChronicFail });'
);
seed(globalThis);

const _lsStore = new Map();
globalThis.localStorage = {
  getItem: (k) => (_lsStore.has(k) ? _lsStore.get(k) : null),
  setItem: (k, v) => _lsStore.set(k, String(v)),
  removeItem: (k) => _lsStore.delete(k),
  clear: () => _lsStore.clear(),
};

let G, getTopicMastery, calcEstScore;

beforeAll(async () => {
  G = (await import('../src/core/globals.js')).default;
  const heatmap = await import('../src/ui/heatmap.js');
  getTopicMastery = heatmap.getTopicMastery;
  const trackView = await import('../src/ui/track-view.js');
  calcEstScore = trackView.calcEstScore;
});

beforeEach(() => {
  G.S = { sr: {}, ts: {} };
  G.QZ = [];
  // 27 topics × 3 questions for any test that uses topic indices.
  for (let ti = 0; ti < 27; ti++) {
    for (let j = 0; j < 3; j++) G.QZ.push({ ti, q: `t${ti}q${j}`, o: ['a','b','c','d'], c: 0 });
  }
});

describe('honest stats — calcEstScore', () => {
  it('returns null for completely empty state (zero answers)', () => {
    expect(calcEstScore()).toBeNull();
  });

  it('returns null when only 1 topic has data', () => {
    G.S.ts[0] = { ok: 5, tot: 10, no: 5 };
    expect(calcEstScore()).toBeNull();
  });

  it('returns null when only 2 topics have data (need ≥3)', () => {
    G.S.ts[0] = { ok: 5, tot: 10, no: 5 };
    G.S.ts[1] = { ok: 3, tot: 10, no: 7 };
    expect(calcEstScore()).toBeNull();
  });

  it('does NOT default to 60 on sparse data', () => {
    expect(calcEstScore()).not.toBe(60);
    expect(calcEstScore()).not.toBe(0.6);
  });

  it('returns a real number once 3+ topics have ≥3 answers each', () => {
    G.S.ts[0] = { ok: 3, tot: 3, no: 0 };
    G.S.ts[1] = { ok: 3, tot: 3, no: 0 };
    G.S.ts[2] = { ok: 3, tot: 3, no: 0 };
    const score = calcEstScore();
    expect(score).not.toBeNull();
    expect(typeof score).toBe('number');
  });

  it('topics with <3 answers do NOT contribute to the score', () => {
    G.S.ts[0] = { ok: 3, tot: 3, no: 0 };
    G.S.ts[1] = { ok: 3, tot: 3, no: 0 };
    G.S.ts[2] = { ok: 3, tot: 3, no: 0 };
    const baseScore = calcEstScore();
    G.S.ts[3] = { ok: 0, tot: 1, no: 1 };
    expect(calcEstScore()).toBe(baseScore);
  });
});

describe('honest stats — getTopicMastery', () => {
  it('returns no-data state when state is empty', () => {
    const out = getTopicMastery();
    out.forEach(row => {
      expect(row.attempted).toBe(false);
      expect(row.rMean).toBeNull();
      expect(row.n).toBe(0);
    });
  });

  it('REGRESSION: just-failed card (tot=1, ok=0) → mastery = 0, NOT ~1.0', () => {
    G.S.sr[0] = { fsrsS: 5, lastReview: Date.now() - 1000, tot: 1, ok: 0 };
    const out = getTopicMastery();
    const t0 = out.find(r => r.ti === 0);
    expect(t0.attempted).toBe(true);
    expect(t0.rMean).toBe(0);
  });

  it('REGRESSION: 0/4 topic (4 wrong in a row) → mastery = 0', () => {
    G.S.sr[0] = { fsrsS: 5, lastReview: Date.now(), tot: 1, ok: 0 };
    G.S.sr[1] = { fsrsS: 5, lastReview: Date.now(), tot: 1, ok: 0 };
    G.S.sr[2] = { fsrsS: 5, lastReview: Date.now(), tot: 1, ok: 0 };
    G.S.sr[3] = { fsrsS: 5, lastReview: Date.now(), tot: 1, ok: 0 };
    const out = getTopicMastery();
    const t0 = out.find(r => r.ti === 0);
    expect(t0.rMean).toBe(0);
  });

  it('cards with tot=0 (never answered) are skipped', () => {
    G.S.sr[0] = { fsrsS: 5, lastReview: Date.now() }; // no tot/ok
    const out = getTopicMastery();
    const t0 = out.find(r => r.ti === 0);
    expect(t0.attempted).toBe(false);
  });

  it('mixed accuracy + just answered → meanR proportional, not 1.0', () => {
    // One card with 50% accuracy on topic 0 — must NOT show ~1.0.
    G.S.sr[0] = { fsrsS: 5, lastReview: Date.now(), tot: 4, ok: 2 };
    const out = getTopicMastery();
    const t0 = out.find(r => r.ti === 0);
    expect(t0.rMean).toBeGreaterThan(0.4);
    expect(t0.rMean).toBeLessThan(0.6);
  });

  it('legacy SM-2 cards (no fsrsS) still produce mastery from raw hit-rate', () => {
    G.S.sr[0] = { ef: 2.5, n: 1, tot: 4, ok: 2 };
    const out = getTopicMastery();
    const t0 = out.find(r => r.ti === 0);
    expect(t0.attempted).toBe(true);
    expect(t0.rMean).toBe(0.5);
  });
});

describe('honest stats — source-level guard', () => {
  it('calcEstScore must NOT contain the literal "acc=0.60" imputation', () => {
    // Normalize CRLF→LF so the regex works on Windows checkouts where line
    // endings haven't been normalized to LF yet (gitattributes-dependent).
    const src = readFileSync(resolve(process.cwd(), 'src', 'ui', 'track-view.js'), 'utf-8').replace(/\r\n/g, '\n');
    const calcEst = src.match(/export function calcEstScore\(\)[\s\S]*?\n\}\n/);
    expect(calcEst, 'calcEstScore function not found').not.toBeNull();
    expect(calcEst[0]).not.toMatch(/acc\s*=\s*0\.60/);
    expect(calcEst[0]).not.toMatch(/acc\s*=\s*0\.6\b/);
  });

  it('heatmap must NOT use pure FSRS R aggregation (must mix in ok/tot)', () => {
    const src = readFileSync(resolve(process.cwd(), 'src', 'ui', 'heatmap.js'), 'utf-8');
    const getTopic = src.match(/export function getTopicMastery\(\)[\s\S]*?\n\}/);
    expect(getTopic, 'getTopicMastery not found').not.toBeNull();
    expect(getTopic[0]).not.toMatch(/byTopic\[[^\]]+\]\.sum\s*\+=\s*r\s*;/);
  });

  it('takeWeeklySnapshot must require ≥3 answers per topic', () => {
    // Bug: snapshotting `s.tot>0?Math.round(s.ok/s.tot*100):null` produces
    // 0% or 100% from a single answer, driving misleading trend arrows.
    const src = readFileSync(resolve(process.cwd(), 'src', 'ui', 'app.js'), 'utf-8');
    const takeFn = src.match(/export function takeWeeklySnapshot\(\)[\s\S]*?\n\}/);
    expect(takeFn, 'takeWeeklySnapshot not found').not.toBeNull();
    expect(takeFn[0]).not.toMatch(/s\.tot>0\s*\?\s*Math\.round/);
    expect(takeFn[0]).toMatch(/s\.tot\s*>=\s*[3-9]/);
  });

  it('takeWeeklySnapshot iterates over TOPICS.length, not a hardcoded count', () => {
    // Sibling-sync guard for the Geri v10.61.2 fix: hardcoded `i<40` there
    // silently dropped the 6 topics added in v10.41 (TOPICS expanded
    // 40→46). Mishpacha's TOPICS=27 so the same bug shape would lose any
    // topic added beyond the literal upper bound.
    const src = readFileSync(resolve(process.cwd(), 'src', 'ui', 'app.js'), 'utf-8');
    const takeFn = src.match(/export function takeWeeklySnapshot\(\)[\s\S]*?\n\}/);
    expect(takeFn, 'takeWeeklySnapshot not found').not.toBeNull();
    // Negative marker: any `for (let i=0; i<<digits>;` loop is the bug shape.
    expect(takeFn[0]).not.toMatch(/for\s*\(\s*let\s+i\s*=\s*0\s*;\s*i\s*<\s*\d+\s*;/);
    // Positive marker: must use TOPICS.length so future topic additions are tracked.
    expect(takeFn[0]).toMatch(/i\s*<\s*TOPICS\.length/);
  });
});
