/**
 * Tests for startSuddenDeath and endSuddenDeath in src/quiz/modes.js.
 *
 * Setup notes:
 *   - modes.js only imports G and { fmtT, toast } — no FSRS bridge needed.
 *   - toast() wraps its body in try/catch, so missing document is harmless.
 *   - localStorage is shimmed manually (no jsdom).
 *   - G.render is mocked so the null default doesn't throw.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import G from '../src/core/globals.js';
import { startSuddenDeath, endSuddenDeath } from '../src/quiz/modes.js';

function installLocalStorageShim() {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
  return store;
}

beforeEach(() => {
  installLocalStorageShim();
  G.QZ = [
    { ti: 0, q: 'Q1' },
    { ti: 1, q: 'Q2' },
    { ti: 2, q: 'Q3' },
    { ti: 0, q: 'Q4' },
    { ti: 1, q: 'Q5' },
  ];
  G.sdLeaderboard = [];
  G.sdMode = false;
  G.sdStreak = 0;
  G.sdPool = [];
  G.sdQi = 0;
  G.sel = 1;
  G.ans = true;
  G.render = vi.fn();
  G.S = { sr: {}, streak: 0, qOk: 0, qNo: 0 };
});

// ---- startSuddenDeath ------------------------------------------------------

describe('startSuddenDeath', () => {
  it('sets sdMode to true', () => {
    startSuddenDeath();
    expect(G.sdMode).toBe(true);
  });

  it('resets sdStreak to 0', () => {
    G.sdStreak = 7;
    startSuddenDeath();
    expect(G.sdStreak).toBe(0);
  });

  it('builds sdPool from all G.QZ indices', () => {
    startSuddenDeath();
    expect(G.sdPool).toHaveLength(G.QZ.length);
    const sorted = G.sdPool.slice().sort((a, b) => a - b);
    expect(sorted).toEqual([0, 1, 2, 3, 4]);
  });

  it('resets sel and ans', () => {
    startSuddenDeath();
    expect(G.sel).toBeNull();
    expect(G.ans).toBe(false);
  });

  it('resets sdQi to 0', () => {
    G.sdQi = 3;
    startSuddenDeath();
    expect(G.sdQi).toBe(0);
  });

  it('calls G.render', () => {
    startSuddenDeath();
    expect(G.render).toHaveBeenCalledTimes(1);
  });

  it('shuffles the pool (statistical: very unlikely to be identity for n=5)', () => {
    // Run 20 times and expect at least one non-identity shuffle.
    const identity = [0, 1, 2, 3, 4];
    let seenShuffle = false;
    for (let i = 0; i < 20; i++) {
      G.sdPool = [];
      startSuddenDeath();
      if (G.sdPool.join(',') !== identity.join(',')) {
        seenShuffle = true;
        break;
      }
    }
    expect(seenShuffle).toBe(true);
  });
});

// ---- endSuddenDeath --------------------------------------------------------

describe('endSuddenDeath', () => {
  it('sets sdMode to false', () => {
    G.sdMode = true;
    G.sdStreak = 3;
    endSuddenDeath();
    expect(G.sdMode).toBe(false);
  });

  it('appends the current streak to sdLeaderboard', () => {
    G.sdStreak = 5;
    endSuddenDeath();
    expect(G.sdLeaderboard).toHaveLength(1);
    expect(G.sdLeaderboard[0].streak).toBe(5);
  });

  it('leaderboard entry includes a date string (YYYY-MM-DD)', () => {
    G.sdStreak = 2;
    endSuddenDeath();
    expect(G.sdLeaderboard[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('sorts leaderboard in descending streak order', () => {
    G.sdLeaderboard = [{ streak: 3, date: '2026-01-01' }, { streak: 7, date: '2026-01-02' }];
    G.sdStreak = 5;
    endSuddenDeath();
    const streaks = G.sdLeaderboard.map((e) => e.streak);
    expect(streaks).toEqual([...streaks].sort((a, b) => b - a));
  });

  it('caps leaderboard at 10 entries', () => {
    for (let i = 0; i < 12; i++) {
      G.sdLeaderboard.push({ streak: i, date: '2026-01-01' });
    }
    G.sdStreak = 99;
    endSuddenDeath();
    expect(G.sdLeaderboard.length).toBeLessThanOrEqual(10);
  });

  it('persists leaderboard to localStorage as mishpacha_sd_lb', () => {
    G.sdStreak = 4;
    endSuddenDeath();
    const stored = JSON.parse(localStorage.getItem('mishpacha_sd_lb'));
    expect(Array.isArray(stored)).toBe(true);
    expect(stored[0].streak).toBe(4);
  });

  it('calls G.render', () => {
    endSuddenDeath();
    expect(G.render).toHaveBeenCalled();
  });

  it('top entry is always the highest streak after multiple sessions', () => {
    G.sdStreak = 10;
    endSuddenDeath();
    G.sdMode = true; // reset for second round
    G.sdStreak = 20;
    endSuddenDeath();
    G.sdMode = true;
    G.sdStreak = 5;
    endSuddenDeath();
    expect(G.sdLeaderboard[0].streak).toBe(20);
  });
});
