import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// shared/fsrs.js (via src/sr/fsrs-bridge.js) reads `window` at module top —
// set it before the dynamic imports, which run after this assignment (static
// ESM imports would hoist above it). Mirrors InternalMedicine's track test.
globalThis.window = globalThis;

let G, getTrackStatsDonutData;

const SRC = readFileSync(
  fileURLToPath(new URL('../src/ui/track-view.js', import.meta.url)),
  'utf-8',
);

beforeAll(async () => {
  G = (await import('../src/core/globals.js')).default;
  getTrackStatsDonutData = (await import('../src/ui/track-view.js')).getTrackStatsDonutData;
});

beforeEach(() => {
  G.QZ = [{}, {}, {}, {}];
  G.S = { sr: {}, qOk: 0, qNo: 0, ck: {}, bk: {} };
});

describe('track progress donut data', () => {
  it('summarizes correct / wrong / unanswered and both accuracies from G.S.sr', () => {
    G.S.sr = {
      0: { n: 2, tot: 3, ok: 2 },
      1: { n: 0, tot: 2, ok: 1 },
      999: { n: 1, tot: 1, ok: 1 }, // stale (not in G.QZ) → ignored
    };

    expect(getTrackStatsDonutData()).toEqual({
      total: 4,
      correct: 1,
      wrong: 1,
      unanswered: 2,
      answered: 2,
      attemptTotal: 5,
      attemptCorrect: 3,
      accuracy: 50,
      attemptAccuracy: 60,
    });
  });

  it('keeps question-status accuracy separate from historical attempt accuracy', () => {
    G.S.sr = {
      0: { n: 1, tot: 10, ok: 10 },
      1: { n: 0, tot: 1, ok: 0 },
    };

    expect(getTrackStatsDonutData()).toMatchObject({
      correct: 1,
      wrong: 1,
      accuracy: 50,
      attemptAccuracy: 91,
    });
  });

  it('counts a give-up record (n-only, tot=0) as a wrong question without an attempt', () => {
    // showAnswerHardFail writes {ef,n:0,next} with no tot/ok — must read as wrong,
    // and must not break attempt accuracy (no graded attempt to count).
    G.S.sr = { 0: { ef: 2.5, n: 0, next: 0 } };

    expect(getTrackStatsDonutData()).toMatchObject({
      correct: 0,
      wrong: 1,
      answered: 1,
      attemptTotal: 0,
      attemptAccuracy: null,
    });
  });

  it('returns null accuracies and zero counts on a fresh store', () => {
    expect(getTrackStatsDonutData()).toEqual({
      total: 4,
      correct: 0,
      wrong: 0,
      unanswered: 4,
      answered: 0,
      attemptTotal: 0,
      attemptCorrect: 0,
      accuracy: null,
      attemptAccuracy: null,
    });
  });

  it('excludes soft-retired dup/broken questions from totals and the SR loop', () => {
    // the render chokepoint filters these out of every reachable pool, so a
    // user who answers all reachable questions should still reach 100% coverage.
    G.QZ = [{}, { dup: true }, {}, { broken: true }, {}];
    G.S.sr = {
      0: { n: 1, tot: 1, ok: 1 },
      1: { n: 1, tot: 1, ok: 1 }, // dup → must be ignored
    };
    const d = getTrackStatsDonutData();
    expect(d.total).toBe(3); // 5 minus 1 dup minus 1 broken
    expect(d.correct).toBe(1); // only idx0; idx1 (dup) ignored
    expect(d.unanswered).toBe(2);
  });

  it('treats a restored entry with attempt history but no n as correct via hit-rate', () => {
    // backup/legacy entries can carry tot/ok without an n field (the shape
    // heatmap mastery already accepts); they must not all read as wrong.
    G.QZ = [{}, {}];
    G.S.sr = { 0: { tot: 3, ok: 3 }, 1: { tot: 2, ok: 0 } };
    expect(getTrackStatsDonutData()).toMatchObject({
      correct: 1, // idx0 ok>0 → known
      wrong: 1, // idx1 ok=0 → not known
      attemptAccuracy: 60, // (3+0)/(3+2)
    });
  });
});

describe('track progress donut wiring (source guard)', () => {
  it('defines the donut card and renders it inside renderTrack', () => {
    expect(SRC).toMatch(/function _familyStatsDonutCard\(\)/);
    expect(SRC).toMatch(/h\+=_familyStatsDonutCard\(\);/);
  });

  it('uses a conic-gradient donut with Hebrew RTL-safe attrs and an a11y label', () => {
    expect(SRC).toContain('conic-gradient(');
    expect(SRC).toContain('סטטיסטיקת התקדמות');
    expect(SRC).toContain('unicode-bidi:plaintext');
    expect(SRC).toMatch(/role="img" aria-label=/);
  });

  it('does not duplicate the heatmap or priority matrix inside the donut card', () => {
    const card = SRC.slice(
      SRC.indexOf('function _familyStatsDonutCard()'),
      SRC.indexOf('export function renderTrack()'),
    );
    expect(card).not.toMatch(/renderHeatmap|Priority Matrix|priority-matrix/);
  });
});
