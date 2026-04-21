/**
 * Tests for activity-tracking and analytics helpers in
 * src/sr/spaced-repetition.js:
 *
 *   getTopicStats, getWeakTopics, getStudyStreak,
 *   trackDailyActivity, trackChapterRead, getChaptersDueForReading
 *
 * srScore, getDueQuestions, and isExamTrap are covered by srScore.test.js.
 *
 * Bootstrap pattern mirrors srScore.test.js:
 *   - globalThis.window = globalThis so fsrs-bridge.js loads cleanly.
 *   - shared/fsrs.js is seeded into globalThis before the module imports.
 *   - Dynamic import used to guarantee seed runs first.
 */

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Minimal browser shim for fsrs-bridge.js
globalThis.window = globalThis;

const fsrsSrc = readFileSync(resolve(process.cwd(), 'shared', 'fsrs.js'), 'utf-8');
const seed = new Function(
  'target',
  fsrsSrc +
    ';Object.assign(target, { FSRS_W, FSRS_DECAY, FSRS_FACTOR, FSRS_RETENTION,' +
    ' fsrsR, fsrsInterval, fsrsInitNew, fsrsUpdate, fsrsMigrateFromSM2, isChronicFail });'
);
seed(globalThis);

let G,
  getTopicStats,
  getWeakTopics,
  getStudyStreak,
  trackDailyActivity,
  trackChapterRead,
  getChaptersDueForReading;

beforeAll(async () => {
  G = (await import('../src/core/globals.js')).default;
  const mod = await import('../src/sr/spaced-repetition.js');
  getTopicStats = mod.getTopicStats;
  getWeakTopics = mod.getWeakTopics;
  getStudyStreak = mod.getStudyStreak;
  trackDailyActivity = mod.trackDailyActivity;
  trackChapterRead = mod.trackChapterRead;
  getChaptersDueForReading = mod.getChaptersDueForReading;
});

beforeEach(() => {
  G.S = {
    sr: {},
    streak: 0,
    lastDay: null,
    dailyAct: {},
    chReads: {},
    qOk: 0,
    qNo: 0,
  };
  G.QZ = [
    { ti: 0 }, // q0 → topic 0
    { ti: 0 }, // q1 → topic 0
    { ti: 1 }, // q2 → topic 1
    { ti: 2 }, // q3 → topic 2
  ];
  G.qStartTime = Date.now() - 1000;
  G._sessionOk = 0;
  G._sessionNo = 0;
  G._sessionBest = {};
  G._sessionWorse = {};
  G.save = vi.fn();
});

// ---- getTopicStats ---------------------------------------------------------

describe('getTopicStats', () => {
  it('returns empty object when no sr entries exist', () => {
    expect(getTopicStats()).toEqual({});
  });

  it('counts questions with n>0 as ok', () => {
    G.S.sr = {
      0: { n: 2 }, // q0 → topic 0, ok
      1: { n: 0 }, // q1 → topic 0, no
      2: { n: 1 }, // q2 → topic 1, ok
    };
    const stats = getTopicStats();
    expect(stats[0].ok).toBe(1);
    expect(stats[0].no).toBe(1);
    expect(stats[0].tot).toBe(2);
    expect(stats[1].ok).toBe(1);
    expect(stats[1].no).toBe(0);
    expect(stats[1].tot).toBe(1);
  });

  it('skips sr entries whose qIdx is out of range in G.QZ', () => {
    G.S.sr = {
      99: { n: 1 }, // no corresponding G.QZ[99]
    };
    expect(getTopicStats()).toEqual({});
  });

  it('accumulates multiple questions in the same topic', () => {
    G.S.sr = {
      0: { n: 1 }, // topic 0, ok
      1: { n: 1 }, // topic 0, ok
    };
    const stats = getTopicStats();
    expect(stats[0].tot).toBe(2);
    expect(stats[0].ok).toBe(2);
  });
});

// ---- getWeakTopics ---------------------------------------------------------

describe('getWeakTopics', () => {
  it('returns empty array when no topic has ≥3 sr entries', () => {
    G.S.sr = { 0: { n: 1 }, 1: { n: 0 } };
    expect(getWeakTopics()).toEqual([]);
  });

  it('returns topics sorted by ascending accuracy', () => {
    // topic 0: 3 questions, 1 correct (33%)
    // topic 1: 3 questions, 2 correct (67%)
    G.S.sr = {
      0: { n: 1 }, // topic 0 ok
      1: { n: 0 }, // topic 0 no
      2: { n: 1 }, // topic 1 ok (but q2 is in topic 1)
    };
    // Need at least 3 per topic → add more QZ entries
    G.QZ = [
      { ti: 0 }, { ti: 0 }, { ti: 0 }, // indices 0,1,2 → topic 0
      { ti: 1 }, { ti: 1 }, { ti: 1 }, // indices 3,4,5 → topic 1
    ];
    G.S.sr = {
      0: { n: 1 }, // topic 0 ok
      1: { n: 0 }, // topic 0 no
      2: { n: 0 }, // topic 0 no
      3: { n: 1 }, // topic 1 ok
      4: { n: 1 }, // topic 1 ok
      5: { n: 0 }, // topic 1 no
    };
    const weak = getWeakTopics(2);
    expect(weak).toHaveLength(2);
    expect(weak[0].ti).toBe(0); // 1/3 = 33% comes first
    expect(weak[0].pct).toBeLessThan(weak[1].pct);
  });

  it('defaults to top 3 and respects n parameter', () => {
    G.QZ = Array.from({ length: 15 }, (_, i) => ({ ti: Math.floor(i / 3) }));
    G.S.sr = {};
    // 5 topics, 3 each, all incorrect
    for (let i = 0; i < 15; i++) G.S.sr[i] = { n: 0 };
    expect(getWeakTopics(2)).toHaveLength(2);
    expect(getWeakTopics(5)).toHaveLength(5);
    expect(getWeakTopics()).toHaveLength(3); // default n=3
  });
});

// ---- getStudyStreak --------------------------------------------------------

describe('getStudyStreak', () => {
  it('returns G.S.streak when dailyAct is absent', () => {
    G.S.streak = 5;
    delete G.S.dailyAct;
    expect(getStudyStreak()).toBe(5);
  });

  it('returns 0 when no activity at all', () => {
    G.S.dailyAct = {};
    G.S.streak = 0;
    expect(getStudyStreak()).toBe(0);
  });

  it('returns 1 when only today has activity', () => {
    const today = new Date().toISOString().slice(0, 10);
    G.S.dailyAct = { [today]: { q: 3, ok: 2 } };
    expect(getStudyStreak()).toBe(1);
  });

  it('returns consecutive day count including today', () => {
    const days = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date(Date.now() - i * 86400000);
      days.push(d.toISOString().slice(0, 10));
    }
    G.S.dailyAct = {
      [days[0]]: { q: 5 },
      [days[1]]: { q: 3 },
      [days[2]]: { q: 1 },
    };
    expect(getStudyStreak()).toBe(3);
  });

  it('breaks streak on a gap day', () => {
    const today = new Date().toISOString().slice(0, 10);
    // yesterday is missing — streak should only count today
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);
    G.S.dailyAct = {
      [today]: { q: 2 },
      [twoDaysAgo]: { q: 4 },
    };
    expect(getStudyStreak()).toBe(1);
  });

  it('ignores days with q=0', () => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    G.S.dailyAct = {
      [today]: { q: 3 },
      [yesterday]: { q: 0 }, // not counted
    };
    expect(getStudyStreak()).toBe(1);
  });
});

// ---- trackDailyActivity ----------------------------------------------------

describe('trackDailyActivity', () => {
  it('creates today\'s entry on first call', () => {
    const today = new Date().toISOString().slice(0, 10);
    trackDailyActivity();
    expect(G.S.dailyAct[today]).toBeDefined();
    expect(G.S.dailyAct[today].q).toBe(1);
  });

  it('increments q counter on each call', () => {
    trackDailyActivity();
    trackDailyActivity();
    trackDailyActivity();
    const today = new Date().toISOString().slice(0, 10);
    expect(G.S.dailyAct[today].q).toBe(3);
  });

  it('prunes entries older than 90 days', () => {
    // Pre-populate 95 old days
    for (let i = 10; i < 105; i++) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      G.S.dailyAct[d] = { q: 1 };
    }
    trackDailyActivity(); // triggers pruning
    expect(Object.keys(G.S.dailyAct).length).toBeLessThanOrEqual(90);
  });

  it('initialises dailyAct if missing', () => {
    delete G.S.dailyAct;
    trackDailyActivity();
    expect(G.S.dailyAct).toBeDefined();
  });
});

// ---- trackChapterRead + getChaptersDueForReading ---------------------------

describe('trackChapterRead', () => {
  it('records a timestamp under "source_ch" key', () => {
    const before = Date.now();
    trackChapterRead('goroll', '12');
    const after = Date.now();
    const ts = G.S.chReads['goroll_12'];
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it('overwrites the timestamp on re-read', () => {
    G.S.chReads['goroll_5'] = Date.now() - 1000;
    const before = Date.now();
    trackChapterRead('goroll', '5');
    expect(G.S.chReads['goroll_5']).toBeGreaterThanOrEqual(before);
  });

  it('calls G.save after recording', () => {
    trackChapterRead('nelson', '3');
    expect(G.save).toHaveBeenCalled();
  });
});

describe('getChaptersDueForReading', () => {
  it('returns empty array when chReads is absent', () => {
    delete G.S.chReads;
    expect(getChaptersDueForReading('goroll')).toEqual([]);
  });

  it('returns chapters whose last read is ≥ dayThreshold days ago', () => {
    const old = Date.now() - 35 * 86400000; // 35 days ago
    const recent = Date.now() - 5 * 86400000; // 5 days ago
    G.S.chReads = {
      'goroll_10': old,
      'goroll_20': recent,
    };
    const due = getChaptersDueForReading('goroll', 30);
    expect(due).toHaveLength(1);
    expect(due[0].ch).toBe('10');
    expect(due[0].daysSince).toBeGreaterThanOrEqual(35);
  });

  it('excludes chapters from other sources', () => {
    const old = Date.now() - 40 * 86400000;
    G.S.chReads = {
      'goroll_5': old,
      'nelson_5': old,
    };
    const due = getChaptersDueForReading('goroll', 30);
    expect(due).toHaveLength(1);
    expect(due[0].ch).toBe('5');
  });

  it('sorts by most overdue first', () => {
    const veryOld = Date.now() - 90 * 86400000;
    const old = Date.now() - 45 * 86400000;
    G.S.chReads = { 'goroll_3': old, 'goroll_1': veryOld };
    const due = getChaptersDueForReading('goroll', 30);
    expect(due[0].ch).toBe('1'); // most overdue first
    expect(due[0].daysSince).toBeGreaterThan(due[1].daysSince);
  });

  it('returns empty array when no chapters are overdue', () => {
    G.S.chReads = {
      'goroll_7': Date.now() - 5 * 86400000,
    };
    expect(getChaptersDueForReading('goroll', 30)).toEqual([]);
  });
});
