/**
 * Tests for the wrong-answer review module (src/quiz/wrong-review.js).
 *
 * Covers:
 *   - markWrong / markCorrect lifecycle (eviction at 2 consecutive correct)
 *   - getWrongAnswerPool sort order (recency × IMA weight)
 *   - buildWrongReviewPool side effects on G state
 *   - Pruning of stale + missing entries
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import G from '../src/core/globals.js';
import {
  markWrong,
  markCorrect,
  getWrongSet,
  getWrongAnswerCount,
  getWrongAnswerPool,
  buildWrongReviewPool,
  resetWrongSet,
  EVICT_THRESHOLD,
} from '../src/quiz/wrong-review.js';

beforeEach(() => {
  G.S = { wrongSet: {}, sr: {} };
  G.QZ = [];
  // Build a deterministic 27-topic, 3-Q-each fixture so IMA_WEIGHTS lookups
  // resolve to known values (peds-acute=12, MSK=11, EBM=8, IF/Vac=3, etc.).
  for (let ti = 0; ti < 27; ti++) {
    for (let j = 0; j < 3; j++) G.QZ.push({ ti, q: `t${ti}q${j}`, o: ['a', 'b', 'c', 'd'], c: 0 });
  }
  G.pool = [];
  G.qi = 0;
  G.sel = null;
  G.ans = false;
  G.filt = 'all';
  G.render = vi.fn();
  G.save = vi.fn();
});

// ---- markWrong / markCorrect ----------------------------------------------

describe('markWrong', () => {
  it('records a fresh entry with timestamps and zero consecutiveOk', () => {
    markWrong(5);
    const s = getWrongSet();
    expect(s['5']).toBeDefined();
    expect(typeof s['5'].firstWrongAt).toBe('number');
    expect(typeof s['5'].lastWrongAt).toBe('number');
    expect(s['5'].consecutiveOk).toBe(0);
  });

  it('updates lastWrongAt on a repeat wrong, leaving firstWrongAt untouched', () => {
    markWrong(5);
    const first = getWrongSet()['5'].firstWrongAt;
    // Force a small gap.
    const later = first + 1000;
    vi.useFakeTimers();
    vi.setSystemTime(later);
    markWrong(5);
    const s = getWrongSet()['5'];
    expect(s.firstWrongAt).toBe(first);
    expect(s.lastWrongAt).toBeGreaterThan(first);
    expect(s.consecutiveOk).toBe(0); // streak reset on re-wrong
    vi.useRealTimers();
  });

  it('calls G.save', () => {
    markWrong(3);
    expect(G.save).toHaveBeenCalled();
  });

  it('is a no-op when G.S is missing', () => {
    G.S = null;
    expect(() => markWrong(3)).not.toThrow();
  });
});

describe('markCorrect', () => {
  it('returns false and does nothing when Q is not in the wrong set', () => {
    expect(markCorrect(7)).toBe(false);
    expect(getWrongAnswerCount()).toBe(0);
  });

  it('increments consecutiveOk on a correct answer', () => {
    markWrong(7);
    markCorrect(7);
    expect(getWrongSet()['7'].consecutiveOk).toBe(1);
  });

  it('evicts after EVICT_THRESHOLD consecutive correct', () => {
    markWrong(7);
    expect(EVICT_THRESHOLD).toBe(2);
    expect(markCorrect(7)).toBe(false); // 1
    expect(markCorrect(7)).toBe(true); // 2 → evicted
    expect(getWrongSet()['7']).toBeUndefined();
  });

  it('eviction is reset by a subsequent wrong', () => {
    markWrong(7);
    markCorrect(7); // streak = 1
    markWrong(7); // streak reset to 0
    markCorrect(7); // streak = 1
    expect(getWrongSet()['7']).toBeDefined();
    expect(getWrongSet()['7'].consecutiveOk).toBe(1);
  });
});

// ---- getWrongAnswerPool ---------------------------------------------------

describe('getWrongAnswerPool', () => {
  it('returns an empty array when nothing has been marked wrong', () => {
    expect(getWrongAnswerPool()).toEqual([]);
  });

  it('returns indices, not full objects', () => {
    markWrong(5);
    markWrong(10);
    const pool = getWrongAnswerPool();
    pool.forEach((p) => expect(typeof p).toBe('number'));
  });

  it('prunes Qs that no longer exist in G.QZ', () => {
    markWrong(999); // out of range
    markWrong(5); // valid
    const pool = getWrongAnswerPool();
    expect(pool).toEqual([5]);
  });

  it('prunes entries older than 365 days', () => {
    markWrong(5);
    // Backdate the entry.
    G.S.wrongSet['5'].lastWrongAt = Date.now() - 366 * 86400000;
    expect(getWrongAnswerPool()).toEqual([]);
  });

  it('sorts more-recent wrongs before older ones', () => {
    const now = Date.now();
    G.S.wrongSet = {
      // Both are same topic (ti=0) so weight tie; recency must dominate.
      '0': { firstWrongAt: now - 30 * 86400000, lastWrongAt: now - 30 * 86400000, consecutiveOk: 0 },
      '1': { firstWrongAt: now - 1 * 86400000, lastWrongAt: now - 1 * 86400000, consecutiveOk: 0 },
    };
    const pool = getWrongAnswerPool();
    expect(pool[0]).toBe(1); // newer
    expect(pool[1]).toBe(0);
  });

  it('breaks ties by IMA weight (higher weight first)', () => {
    // Two wrong Qs with identical recency. Index 0 → ti=0 (weight=2),
    // index 72 → ti=24 (weight=12, peds-acute, the heaviest topic).
    // The peds-acute Q must come first.
    const now = Date.now();
    G.S.wrongSet = {
      '0': { firstWrongAt: now, lastWrongAt: now, consecutiveOk: 0 }, // ti=0, wt=2
      '72': { firstWrongAt: now, lastWrongAt: now, consecutiveOk: 0 }, // ti=24, wt=12
    };
    const pool = getWrongAnswerPool();
    expect(pool[0]).toBe(72);
    expect(pool[1]).toBe(0);
  });
});

// ---- buildWrongReviewPool -------------------------------------------------

describe('buildWrongReviewPool', () => {
  it('returns false and skips state mutation when set is empty', () => {
    G.filt = 'all';
    G.pool = [99];
    expect(buildWrongReviewPool()).toBe(false);
    expect(G.filt).toBe('all'); // unchanged
    expect(G.pool).toEqual([99]); // unchanged
  });

  it('installs the pool, sets filter, resets quiz UI state', () => {
    markWrong(5);
    markWrong(7);
    G.qi = 4;
    G.sel = 2;
    G.ans = true;
    expect(buildWrongReviewPool()).toBe(true);
    expect(G.filt).toBe('wrong-review');
    expect(G.pool.length).toBe(2);
    expect(G.qi).toBe(0);
    expect(G.sel).toBeNull();
    expect(G.ans).toBe(false);
  });

  it('calls G.render', () => {
    markWrong(5);
    buildWrongReviewPool();
    expect(G.render).toHaveBeenCalled();
  });
});

// ---- resetWrongSet ---------------------------------------------------------

describe('resetWrongSet', () => {
  it('wipes everything', () => {
    markWrong(1);
    markWrong(2);
    markWrong(3);
    expect(getWrongAnswerCount()).toBe(3);
    resetWrongSet();
    expect(getWrongAnswerCount()).toBe(0);
  });

  it('persists via G.save', () => {
    markWrong(1);
    G.save.mockClear();
    resetWrongSet();
    expect(G.save).toHaveBeenCalled();
  });

  it('is a no-op when G.S is missing', () => {
    G.S = null;
    expect(() => resetWrongSet()).not.toThrow();
  });
});
