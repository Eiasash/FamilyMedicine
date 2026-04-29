/**
 * Tests for the topic heatmap module (src/ui/heatmap.js).
 *
 * Covers:
 *   - bucketize() boundaries (5-step Viridis mapping)
 *   - getTopicMastery() with FSRS state
 *   - renderHeatmap() output structure (SVG, 27 cells, click data attrs)
 *
 * Bootstrap mirrors quizModes.test.js — minimal browser shims, fsrs seeded
 * into globalThis before module import.
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
    ' fsrsR, fsrsInterval, fsrsInitNew, fsrsUpdate, fsrsMigrateFromSM2, isChronicFail });',
);
seed(globalThis);

const _lsStore = new Map();
globalThis.localStorage = {
  getItem: (k) => (_lsStore.has(k) ? _lsStore.get(k) : null),
  setItem: (k, v) => _lsStore.set(k, String(v)),
  removeItem: (k) => _lsStore.delete(k),
  clear: () => _lsStore.clear(),
};

let G;
let bucketize, getTopicMastery, renderHeatmap, VIRIDIS_5, NO_DATA_COLOR;

beforeAll(async () => {
  G = (await import('../src/core/globals.js')).default;
  const mod = await import('../src/ui/heatmap.js');
  bucketize = mod.bucketize;
  getTopicMastery = mod.getTopicMastery;
  renderHeatmap = mod.renderHeatmap;
  VIRIDIS_5 = mod.VIRIDIS_5;
  NO_DATA_COLOR = mod.NO_DATA_COLOR;
});

beforeEach(() => {
  G.S = { sr: {} };
  G.QZ = [];
  // 27 topics × 3 questions each = 81
  for (let ti = 0; ti < 27; ti++) {
    for (let j = 0; j < 3; j++) G.QZ.push({ ti, q: `t${ti}q${j}`, o: ['a', 'b', 'c', 'd'], c: 0 });
  }
});

describe('bucketize', () => {
  it('returns 0 for R below 0.5', () => {
    expect(bucketize(0)).toBe(0);
    expect(bucketize(0.49)).toBe(0);
  });
  it('returns 1 for [0.5, 0.65)', () => {
    expect(bucketize(0.5)).toBe(1);
    expect(bucketize(0.64)).toBe(1);
  });
  it('returns 2 for [0.65, 0.8)', () => {
    expect(bucketize(0.65)).toBe(2);
    expect(bucketize(0.79)).toBe(2);
  });
  it('returns 3 for [0.8, 0.9)', () => {
    expect(bucketize(0.8)).toBe(3);
    expect(bucketize(0.89)).toBe(3);
  });
  it('returns 4 for >= 0.9', () => {
    expect(bucketize(0.9)).toBe(4);
    expect(bucketize(1.0)).toBe(4);
  });
  it('handles invalid input by returning 0', () => {
    expect(bucketize(NaN)).toBe(0);
    expect(bucketize(undefined)).toBe(0);
    expect(bucketize('not a number')).toBe(0);
  });
});

describe('VIRIDIS_5 palette', () => {
  it('has exactly 5 colors', () => {
    expect(VIRIDIS_5.length).toBe(5);
  });
  it('starts dark (purple) and ends bright (yellow)', () => {
    expect(VIRIDIS_5[0]).toBe('#440154');
    expect(VIRIDIS_5[4]).toBe('#fde725');
  });
  it('all colors are 7-char hex', () => {
    VIRIDIS_5.forEach((c) => expect(c).toMatch(/^#[0-9a-f]{6}$/i));
  });
});

describe('getTopicMastery', () => {
  it('returns 27 entries (one per topic)', () => {
    const m = getTopicMastery();
    expect(m.length).toBe(27);
  });

  it('marks all topics as not attempted when no SR data', () => {
    const m = getTopicMastery();
    m.forEach((row) => {
      expect(row.attempted).toBe(false);
      expect(row.rMean).toBeNull();
      expect(row.n).toBe(0);
    });
  });

  it('computes rMean from accuracy × R (3/3 correct + just-reviewed → ~1.0)', () => {
    // Per-card mastery = (ok/tot) × R. With ok=3/tot=3 and S=10 just reviewed,
    // R ≈ 1.0 → mastery ≈ 1.0.
    G.S.sr[0] = { fsrsS: 10, fsrsD: 5, lastReview: Date.now(), ok: 3, tot: 3 };
    G.S.sr[1] = { fsrsS: 10, fsrsD: 5, lastReview: Date.now(), ok: 3, tot: 3 };
    const m = getTopicMastery();
    const t0 = m.find((r) => r.ti === 0);
    expect(t0.attempted).toBe(true);
    expect(t0.n).toBe(2);
    expect(t0.rMean).toBeGreaterThan(0.99); // ~1.0
  });

  it('regression: just-answered wrong card does NOT show 100% mastery', () => {
    // The original bug — FSRS R alone gave ~1.0 for any card answered seconds ago,
    // even if wrong. New mastery = (ok/tot)*R must be 0 when ok=0.
    G.S.sr[0] = { fsrsS: 10, fsrsD: 5, lastReview: Date.now() - 60000, ok: 0, tot: 1 };
    const m = getTopicMastery();
    const t0 = m.find((r) => r.ti === 0);
    expect(t0.attempted).toBe(true);
    expect(t0.rMean).toBe(0);
  });

  it('falls back to raw hit-rate when FSRS state missing', () => {
    // Legacy SM-2-only cards (no fsrsS) — use raw ok/tot.
    G.S.sr[0] = { ef: 2.5, n: 1, tot: 4, ok: 2 };
    const m = getTopicMastery();
    const t0 = m.find((r) => r.ti === 0);
    expect(t0.attempted).toBe(true);
    expect(t0.rMean).toBe(0.5);
  });

  it('skips SR entries with tot=0 (never answered)', () => {
    G.S.sr[0] = { fsrsS: 10, fsrsD: 5, lastReview: Date.now() }; // no tot/ok
    const m = getTopicMastery();
    const t0 = m.find((r) => r.ti === 0);
    expect(t0.attempted).toBe(false);
  });

  it('ignores SR entries pointing to deleted Qs', () => {
    G.S.sr[999] = { fsrsS: 10, fsrsD: 5, lastReview: Date.now(), ok: 1, tot: 1 };
    const m = getTopicMastery();
    const totalAttempted = m.filter((r) => r.attempted).length;
    expect(totalAttempted).toBe(0);
  });
});

describe('renderHeatmap', () => {
  it('returns a string containing an svg element', () => {
    const html = renderHeatmap();
    expect(typeof html).toBe('string');
    expect(html).toContain('<svg');
    expect(html).toContain('</svg>');
  });

  it('contains 27 clickable topic cells', () => {
    const html = renderHeatmap();
    const matches = html.match(/data-action="goto-quiz-topic"/g);
    expect(matches).not.toBeNull();
    expect(matches.length).toBe(27);
  });

  it('cells have data-ti spanning 0..26', () => {
    const html = renderHeatmap();
    for (let ti = 0; ti < 27; ti++) {
      expect(html).toContain(`data-ti="${ti}"`);
    }
  });

  it('shows no-data color for unanswered topics', () => {
    const html = renderHeatmap();
    expect(html).toContain(NO_DATA_COLOR);
  });

  it('uses VIRIDIS color when topics have data', () => {
    G.S.sr[0] = { fsrsS: 10, fsrsD: 5, lastReview: Date.now(), ok: 3, tot: 3 };
    const html = renderHeatmap();
    expect(html).toContain(VIRIDIS_5[4]);
  });

  it('includes a legend with all 5 viridis bands', () => {
    const html = renderHeatmap();
    VIRIDIS_5.forEach((c) => expect(html).toContain(c));
  });

  it('includes percentage labels for attempted topics', () => {
    G.S.sr[0] = { fsrsS: 10, fsrsD: 5, lastReview: Date.now(), ok: 3, tot: 3 };
    const html = renderHeatmap();
    expect(html).toMatch(/>100%</);
  });

  it('includes a placeholder dot for unanswered topics', () => {
    const html = renderHeatmap();
    expect(html).toContain('>·<');
  });
});
