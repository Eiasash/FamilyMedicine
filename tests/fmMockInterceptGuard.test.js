/**
 * FM-6 (2026-07-15): checkMockIntercept() crash guard.
 *
 * mockExamResults.byTopic is seeded only for the EXAM_FREQ topic indices
 * (0..26). A question whose ti is >=27 (or otherwise unseeded) used to run
 * `byTopic[q.ti].ok++` on `undefined`, throwing mid-mock and aborting the
 * exam. The fix guards the increment on the bucket's existence.
 *
 * Bootstrap mirrors engineNav.test.js — mock the sr / AI boundaries so the
 * engine imports cleanly under node.
 */
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';

// engine.js reads `window.check` at module-load time; shim window for node.
globalThis.window = globalThis;

vi.mock('../src/sr/spaced-repetition.js', () => ({
  getDueQuestions: vi.fn(() => []),
  getDueCount: vi.fn(() => 0),
  getTopicStats: vi.fn(() => ({})),
  isExamTrap: vi.fn(() => false),
  srScore: vi.fn(),
  buildRescuePool: vi.fn(),
}));
vi.mock('../src/ai/client.js', () => ({ callAI: vi.fn() }));
vi.mock('../src/ai/explain.js', () => ({ aiAutopsy: vi.fn() }));

import G from '../src/core/globals.js';

let checkMockIntercept;
beforeAll(async () => {
  checkMockIntercept = (await import('../src/quiz/engine.js')).checkMockIntercept;
});

beforeEach(() => {
  G.QZ = [];
  G.pool = [];
  G.qi = 0;
  G.sel = null;
  G.ans = false;
  G._reveal = false;
  G.mockExamResults = null;
  G._mockAnswered = 0;
  G.S = { sr: {}, qOk: 0, qNo: 0 };
  G.save = vi.fn();
  G.render = vi.fn();
});

describe('FM-6: checkMockIntercept crash guard', () => {
  it('does NOT throw when q.ti is outside the seeded byTopic range (>=27)', () => {
    G.QZ = [{ ti: 27, q: 'Q', o: ['a', 'b', 'c', 'd'], c: 0, t: '2024-May' }];
    G.pool = [0]; G.qi = 0; G.sel = 0; G.ans = false;
    // byTopic seeded only for ti 0 (as EXAM_FREQ.forEach seeds 0..26 in prod).
    G.mockExamResults = { byTopic: { 0: { ok: 0, no: 0 } } };

    expect(() => checkMockIntercept()).not.toThrow();
    // The unseeded topic is simply skipped — no bucket is materialised.
    expect(G.mockExamResults.byTopic[27]).toBeUndefined();
  });

  it('still records a correct answer for a seeded in-range topic', () => {
    G.QZ = [{ ti: 0, q: 'Q', o: ['a', 'b', 'c', 'd'], c: 2, t: '2024-May' }];
    G.pool = [0]; G.qi = 0; G.sel = 2; G.ans = false;
    G.mockExamResults = { byTopic: { 0: { ok: 0, no: 0 } } };

    checkMockIntercept();
    expect(G.mockExamResults.byTopic[0].ok).toBe(1);
    expect(G._mockAnswered).toBe(1);
  });

  it('grades a give-up/timeout reveal (sel=null, _reveal=true) as a miss', () => {
    G.QZ = [{ ti: 0, q: 'Q', o: ['a', 'b', 'c', 'd'], c: 2, t: '2024-May' }];
    G.pool = [0]; G.qi = 0; G.sel = null; G.ans = false; G._reveal = true;
    G.mockExamResults = { byTopic: { 0: { ok: 0, no: 0 } } };

    checkMockIntercept();
    expect(G.mockExamResults.byTopic[0].no).toBe(1);
    expect(G.mockExamResults.byTopic[0].ok).toBe(0);
  });
});
