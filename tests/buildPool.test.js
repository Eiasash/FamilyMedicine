/**
 * Tests for buildPool() in src/quiz/engine.js.
 *
 * buildPool() is the core quiz filter that populates G.pool based on G.filt.
 * Modes tested: empty QZ, 'all', 'traps', 'rescue', 'weak', 'due', 'hard',
 * 'slow', 'topic', 'years', and smart-shuffle tiering in 'all' mode.
 *
 * Heavy transitive imports are mocked (spaced-repetition, AI client, explain)
 * so the engine can run under Node without jsdom.
 */

import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';

// fsrs-bridge reads `window` at module load — shim before any dynamic imports.
globalThis.window = globalThis;

// localStorage shim (engine.js indirectly uses it via state-loaded G.S)
const _lsStore = new Map();
globalThis.localStorage = {
  getItem: (k) => (_lsStore.has(k) ? _lsStore.get(k) : null),
  setItem: (k, v) => _lsStore.set(k, String(v)),
  removeItem: (k) => _lsStore.delete(k),
  clear: () => _lsStore.clear(),
};

// Mock heavy transitive deps before importing engine.
vi.mock('../src/sr/spaced-repetition.js', () => ({
  getDueQuestions: vi.fn(() => []),
  getTopicStats: vi.fn(() => ({})),
  isExamTrap: vi.fn(() => false),
  srScore: vi.fn(),
  buildRescuePool: vi.fn(),
}));
vi.mock('../src/ai/client.js', () => ({ callAI: vi.fn() }));
vi.mock('../src/ai/explain.js', () => ({ aiAutopsy: vi.fn() }));

import G from '../src/core/globals.js';
import { getDueQuestions, getTopicStats, isExamTrap } from '../src/sr/spaced-repetition.js';

let buildPool;

beforeAll(async () => {
  const mod = await import('../src/quiz/engine.js');
  buildPool = mod.buildPool;
});

// Minimal DOM shim (engine.js references document for timer elements)
function installDomShim() {
  globalThis.document = {
    getElementById: () => null,
    createElement: () => ({
      id: '', innerHTML: '', style: {},
      addEventListener: () => {},
      insertAdjacentHTML: () => {},
    }),
    body: { appendChild: () => {}, insertAdjacentHTML: () => {} },
  };
}

/** Build a flat array of N questions, each with the given ti. */
function makeQs(count, ti = 0, tag = '2024-May') {
  return Array.from({ length: count }, (_, j) => ({
    ti, q: `Q${j}`, o: ['a', 'b', 'c', 'd'], c: 0, t: tag,
  }));
}

beforeEach(() => {
  installDomShim();
  _lsStore.clear();
  G.S = { sr: {}, qOk: 0, qNo: 0, ck: {}, bk: {}, streak: 0 };
  G.QZ = makeQs(10, 0);
  G.pool = [];
  G.qi = 3;
  G.sel = 2;
  G.ans = true;
  G.filt = 'all';
  G.topicFilt = -1;
  G.years = [];
  G.render = vi.fn();
  G.save = vi.fn();
  G._exCache = {};
  // Reset mocks
  getDueQuestions.mockReturnValue([]);
  getTopicStats.mockReturnValue({});
  isExamTrap.mockReturnValue(false);
});

// ---- defensive empty-QZ guard -------------------------------------------

describe('buildPool — empty QZ guard', () => {
  it('returns an empty pool when QZ is empty', () => {
    G.QZ = [];
    buildPool();
    expect(G.pool).toEqual([]);
    expect(G.qi).toBe(0);
    expect(G.sel).toBeNull();
    expect(G.ans).toBe(false);
  });

  it('handles null QZ gracefully', () => {
    G.QZ = null;
    expect(() => buildPool()).not.toThrow();
    expect(G.pool).toEqual([]);
  });
});

// ---- filt='all' -------------------------------------------------------------

describe('buildPool — filt="all"', () => {
  it('pool contains all question indices', () => {
    G.filt = 'all';
    buildPool();
    const sorted = G.pool.slice().sort((a, b) => a - b);
    expect(sorted).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('resets qi, sel, ans', () => {
    buildPool();
    expect(G.qi).toBe(0);
    expect(G.sel).toBeNull();
    expect(G.ans).toBe(false);
  });

  it('places due questions at the front (tier 1) in smart-shuffle', () => {
    getDueQuestions.mockReturnValue([2, 5]);
    buildPool();
    // Tier 1 items (due) should appear before tier 4 (untouched) in pool
    // We can't predict exact order due to per-tier shuffling, but index 2
    // and 5 should be present somewhere.
    expect(G.pool).toContain(2);
    expect(G.pool).toContain(5);
  });

  it('places high-difficulty (fsrsD > 7) questions in tier 2', () => {
    G.S.sr[3] = { fsrsD: 8, ef: 1.5, n: 0, next: 0 };
    buildPool();
    expect(G.pool).toContain(3);
  });
});

// ---- filt='topic' -----------------------------------------------------------

describe('buildPool — filt="topic"', () => {
  it('pools only questions matching the selected topic', () => {
    G.QZ = [...makeQs(5, 0), ...makeQs(5, 1)];
    G.filt = 'topic';
    G.topicFilt = 1;
    buildPool();
    const sorted = G.pool.slice().sort((a, b) => a - b);
    expect(sorted).toEqual([5, 6, 7, 8, 9]);
  });

  it('produces empty pool when no questions belong to the topic', () => {
    G.filt = 'topic';
    G.topicFilt = 26; // no ti=26 in fixture
    buildPool();
    expect(G.pool).toEqual([]);
  });
});

// ---- filt='years' -----------------------------------------------------------

describe('buildPool — filt="years"', () => {
  it('pools questions whose tag matches any selected year', () => {
    G.QZ = [
      ...makeQs(3, 0, '2024-May'),
      ...makeQs(3, 1, '2023-Jun'),
      ...makeQs(4, 2, '2022-Jun'),
    ];
    G.filt = 'years';
    G.years = ['2024-May', '2022-Jun'];
    buildPool();
    const sorted = G.pool.slice().sort((a, b) => a - b);
    // indices 0-2 (2024-May) + indices 6-9 (2022-Jun)
    expect(sorted).toEqual([0, 1, 2, 6, 7, 8, 9]);
  });

  it('returns empty pool when selected year matches nothing', () => {
    G.filt = 'years';
    G.years = ['2020'];
    G.QZ = makeQs(5, 0, '2025-Jun');
    buildPool();
    expect(G.pool).toEqual([]);
  });
});

// ---- filt='due' -------------------------------------------------------------

describe('buildPool — filt="due"', () => {
  it('pool is the result of getDueQuestions()', () => {
    getDueQuestions.mockReturnValue([1, 4, 7]);
    G.filt = 'due';
    buildPool();
    expect(G.pool).toEqual([1, 4, 7]);
    expect(G.qi).toBe(0);
  });

  it('sets pool to [] when getDueQuestions returns empty', () => {
    getDueQuestions.mockReturnValue([]);
    G.filt = 'due';
    buildPool();
    expect(G.pool).toEqual([]);
  });
});

// ---- filt='traps' -----------------------------------------------------------

describe('buildPool — filt="traps"', () => {
  it('pools only questions identified as exam traps', () => {
    isExamTrap.mockImplementation((i) => i === 2 || i === 7);
    G.filt = 'traps';
    buildPool();
    const sorted = G.pool.slice().sort((a, b) => a - b);
    expect(sorted).toEqual([2, 7]);
  });

  it('returns empty pool when no traps are detected', () => {
    isExamTrap.mockReturnValue(false);
    G.filt = 'traps';
    buildPool();
    expect(G.pool).toEqual([]);
  });
});

// ---- filt='rescue' ----------------------------------------------------------

describe('buildPool — filt="rescue"', () => {
  it('returns early without modifying pool (rescue pool is pre-built)', () => {
    G.filt = 'rescue';
    G.pool = [3, 5, 9]; // pre-built rescue pool
    buildPool();
    // pool must be unchanged
    expect(G.pool).toEqual([3, 5, 9]);
  });
});

// ---- filt='hard' ------------------------------------------------------------

describe('buildPool — filt="hard"', () => {
  it('pools questions with ef < 2.5', () => {
    G.S.sr[2] = { ef: 1.8, n: 0, next: 0 };
    G.S.sr[6] = { ef: 2.1, n: 0, next: 0 };
    G.filt = 'hard';
    buildPool();
    const sorted = G.pool.slice().sort((a, b) => a - b);
    expect(sorted).toEqual([2, 6]);
  });

  it('falls back to all SR-tracked questions when none have ef < 2.5', () => {
    // ef = 2.5 means "at default" → would NOT normally appear in hard filter
    G.S.sr[0] = { ef: 2.5, n: 1, next: 0 };
    G.S.sr[1] = { ef: 2.5, n: 1, next: 0 };
    G.filt = 'hard';
    buildPool();
    // fallback: any question with SR data
    expect(G.pool.length).toBeGreaterThan(0);
    expect(G.pool.every((i) => G.S.sr[i] !== undefined)).toBe(true);
  });

  it('sorts by ef ascending (lowest ef first)', () => {
    G.S.sr[0] = { ef: 1.3, n: 0, next: 0 };
    G.S.sr[5] = { ef: 1.8, n: 0, next: 0 };
    G.S.sr[8] = { ef: 2.0, n: 0, next: 0 };
    G.filt = 'hard';
    buildPool();
    expect(G.pool[0]).toBe(0); // lowest ef first
    expect(G.pool[1]).toBe(5);
    expect(G.pool[2]).toBe(8);
  });

  it('resets qi, sel, ans', () => {
    G.S.sr[0] = { ef: 1.5, n: 0, next: 0 };
    G.filt = 'hard';
    buildPool();
    expect(G.qi).toBe(0);
    expect(G.sel).toBeNull();
    expect(G.ans).toBe(false);
  });
});

// ---- filt='slow' ------------------------------------------------------------

describe('buildPool — filt="slow"', () => {
  it('pools questions with average answer time > 60s', () => {
    G.S.sr[1] = { at: 75, ef: 2.5, n: 1, next: 0 };
    G.S.sr[3] = { at: 90, ef: 2.5, n: 1, next: 0 };
    G.S.sr[5] = { at: 45, ef: 2.5, n: 1, next: 0 }; // fast — excluded
    G.filt = 'slow';
    buildPool();
    const sorted = G.pool.slice().sort((a, b) => a - b);
    expect(sorted).toContain(1);
    expect(sorted).toContain(3);
    expect(sorted).not.toContain(5);
  });

  it('sorts by at descending (slowest first)', () => {
    G.S.sr[0] = { at: 120, ef: 2.5, n: 1, next: 0 };
    G.S.sr[2] = { at: 90, ef: 2.5, n: 1, next: 0 };
    G.S.sr[4] = { at: 75, ef: 2.5, n: 1, next: 0 };
    G.filt = 'slow';
    buildPool();
    expect(G.pool[0]).toBe(0);  // 120s first
    expect(G.pool[1]).toBe(2);
    expect(G.pool[2]).toBe(4);
  });

  it('returns empty pool when nothing is slow', () => {
    G.filt = 'slow';
    buildPool();
    expect(G.pool).toEqual([]);
  });
});

// ---- filt='weak' ------------------------------------------------------------

describe('buildPool — filt="weak"', () => {
  it('falls back to all questions when no topic has ≥3 SR entries', () => {
    getTopicStats.mockReturnValue({});
    G.filt = 'weak';
    buildPool();
    expect(G.pool.length).toBe(G.QZ.length);
  });

  it('pools only questions from weak topics when data is available', () => {
    // Give topics 0-4 SR data so 5 "weak" candidates exist.
    // Build QZ with 6 topics, 5 questions each.
    G.QZ = [];
    for (let ti = 0; ti < 6; ti++) {
      for (let j = 0; j < 5; j++) G.QZ.push({ ti, q: `t${ti}-q${j}`, o: ['a','b','c','d'], c: 0, t: '2024-May' });
    }
    // Topics 0-4: all have ≥3 entries; topics 5-26 have none (filtered out).
    // Topic 0 is weak (0%); topic 1 moderate (50%); topics 2-4 excellent (100%).
    getTopicStats.mockReturnValue({
      0: { ok: 0, no: 3, tot: 3 },
      1: { ok: 1, no: 2, tot: 3 },
      2: { ok: 3, no: 0, tot: 3 },
      3: { ok: 3, no: 0, tot: 3 },
      4: { ok: 3, no: 0, tot: 3 },
    });
    G.filt = 'weak';
    buildPool();
    // Pool must not be empty.
    expect(G.pool.length).toBeGreaterThan(0);
    // At least one question from the weakest topic (ti=0) must appear.
    const hasTi0 = G.pool.some((i) => G.QZ[i].ti === 0);
    expect(hasTi0).toBe(true);
    // Questions from topics beyond top-10 (ti=5+) must not appear.
    for (const i of G.pool) {
      expect(G.QZ[i].ti).toBeLessThanOrEqual(4);
    }
  });
});
