// @vitest-environment jsdom
/**
 * FM-10 (2026-07-18): G.S.streak must be a REAL study streak.
 *
 * The old updateStreak IIFE in src/core/state.js bumped G.S.streak on the first
 * save() of each calendar day — i.e. merely opening the app — and used UTC
 * (toISOString) day boundaries. Diagnostics + the leaderboard submit G.S.streak,
 * so app-opens inflated it and the UTC boundary rolled over at the wrong local hour.
 *
 * reconcileStreak() now derives the streak from G.S.dailyAct (written only when a
 * question is answered) using the LOCAL date.
 *
 * Pinned to Asia/Jerusalem (UTC+2 in mid-March, pre-DST) so the UTC-vs-local
 * boundary case is deterministic on any CI machine.
 */
process.env.TZ = 'Asia/Jerusalem';

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import G from '../src/core/globals.js';
import { reconcileStreak, localDayKey } from '../src/core/state.js';

beforeEach(() => {
  localStorage.clear();
  G.S = { streak: 0, lastDay: null, dailyAct: {} };
  G.save = vi.fn();
});
afterEach(() => { vi.useRealTimers(); });

describe('FM-10: streak gated on real study activity (not app-open)', () => {
  it('opening the app two days running with NO answers does not increment', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-10T09:00:00')); // local
    reconcileStreak();
    expect(G.S.streak).toBe(0);
    expect(G.S.lastDay).toBe('2026-03-10');

    vi.setSystemTime(new Date('2026-03-11T09:00:00')); // next local day, still no study
    reconcileStreak();
    expect(G.S.streak).toBe(0); // NOT 1 or 2 — no real activity was logged
    expect(G.S.lastDay).toBe('2026-03-11');
  });

  it('counts consecutive LOCAL study days from dailyAct', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-12T20:00:00'));
    const d0 = localDayKey();
    const d1 = localDayKey(Date.now() - 86400000);
    const d2 = localDayKey(Date.now() - 2 * 86400000);
    G.S.dailyAct = { [d0]: { q: 3 }, [d1]: { q: 1 }, [d2]: { q: 5 } };
    reconcileStreak();
    expect(G.S.streak).toBe(3);
  });

  it('tolerates "not studied yet today": counts the run through yesterday', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-12T06:00:00'));
    const d1 = localDayKey(Date.now() - 86400000);
    const d2 = localDayKey(Date.now() - 2 * 86400000);
    G.S.dailyAct = { [d1]: { q: 2 }, [d2]: { q: 2 } }; // today absent
    reconcileStreak();
    expect(G.S.streak).toBe(2);
  });

  it('breaks the streak on a gap day (no cross-gap inflation)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-12T12:00:00'));
    const today = localDayKey();
    const twoAgo = localDayKey(Date.now() - 2 * 86400000); // yesterday missing
    G.S.dailyAct = { [today]: { q: 1 }, [twoAgo]: { q: 9 } };
    reconcileStreak();
    expect(G.S.streak).toBe(1);
  });

  it('uses the LOCAL calendar date, not the UTC toISOString date', () => {
    vi.useFakeTimers();
    // 2026-03-12T23:30Z is 2026-03-13T01:30 in Jerusalem (UTC+2).
    vi.setSystemTime(new Date(Date.UTC(2026, 2, 12, 23, 30, 0)));
    expect(new Date().toISOString().slice(0, 10)).toBe('2026-03-12'); // UTC day
    expect(localDayKey()).toBe('2026-03-13');                          // LOCAL day
    reconcileStreak();
    expect(G.S.lastDay).toBe('2026-03-13'); // reconcile keys off the local date
  });
});
