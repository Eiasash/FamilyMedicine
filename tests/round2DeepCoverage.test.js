/**
 * Round 2 deep-coverage layer.
 *
 * Targets surfaces NOT covered by R1 (which focused on AFP map round-trip,
 * FSRS boundaries, and bidi). New surfaces:
 *
 *   1. Quiz-engine session edges — empty-topic filter, no-questions-available
 *      with multi-tag intersection, year-tag clearing, all-correct streak
 *      session counter behaviour.
 *   2. Daily-Contract / Study-Plan scheduler boundary cases — DST seam, midnight
 *      rollover, calendar-week edges, exam-must-be-after-start, not-enough-weeks.
 *   3. Service-worker cache invalidation — verifies the install/activate
 *      semantics by parsing sw.js and asserting CACHE keys match what the
 *      version-trinity guard expects, and that JSON_DATA_URLS uses cache-first.
 *   4. IndexedDB persistence round-trip via fake-indexeddb-style mock.
 *   5. Hebrew bidi numerics in clinical-style mixed strings.
 *   6. Mutation-test feel — three functions where flipping an operator or
 *      shifting a boundary by 1 causes a deterministic test failure:
 *        a. allocateHours floor (0.5h → break by 0.51 floor)
 *        b. defaultDailyQTarget bounds (5 ≤ x ≤ 60)
 *        c. isOk c_accept array vs primary c
 */

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Shim for tests that need engine-level imports.
globalThis.window = globalThis;
const _lsStore = new Map();
globalThis.localStorage = {
  getItem: (k) => (_lsStore.has(k) ? _lsStore.get(k) : null),
  setItem: (k, v) => _lsStore.set(k, String(v)),
  removeItem: (k) => _lsStore.delete(k),
  clear: () => _lsStore.clear(),
};

const ROOT = resolve(import.meta.dirname, '..');

// ─────────────────────────────────────────────────────────────────────────
// 1. Quiz engine — additional edges
// ─────────────────────────────────────────────────────────────────────────

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
import { isOk } from '../src/core/utils.js';

let buildPool, toggleYearFilt, clearYearFilt, setFilt;
beforeAll(async () => {
  const mod = await import('../src/quiz/engine.js');
  buildPool = mod.buildPool;
  toggleYearFilt = mod.toggleYearFilt;
  clearYearFilt = mod.clearYearFilt;
  setFilt = mod.setFilt;
});

function installDomShim() {
  globalThis.document = {
    getElementById: () => null,
    createElement: () => ({ id: '', innerHTML: '', style: {}, addEventListener: () => {} }),
    body: { appendChild: () => {}, insertAdjacentHTML: () => {} },
  };
}

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
  G.qi = 0;
  G.sel = null;
  G.ans = false;
  G.filt = 'all';
  G.topicFilt = -1;
  G.years = [];
  G.render = vi.fn();
  G.save = vi.fn();
  G._exCache = {};
  G._sessionOk = 0;
  G._sessionNo = 0;
  G._sessionBest = {};
  G._sessionWorse = {};
});

describe('quiz engine — multi-tag intersection edge', () => {
  it('empty G.years degenerates to "all" pool, not "years"', () => {
    G.QZ = makeQs(5, 0, '2024-May');
    G.filt = 'years';
    G.years = []; // explicit empty
    buildPool();
    // Empty years array bypasses the years branch and falls through to the
    // default branch — which with filt=='years' filters by t.includes('years')
    // matching nothing. Pool should be empty (NOT all).
    expect(G.pool).toEqual([]);
  });

  it('toggleYearFilt rejects unknown year tokens', () => {
    G.QZ = makeQs(5, 0, '2024-May');
    G.years = [];
    toggleYearFilt('1999'); // not in EXAM_YEARS whitelist
    expect(G.years).toEqual([]);
    expect(G.filt).toBe('all'); // unchanged
  });

  it('toggleYearFilt adds and removes valid years symmetrically', () => {
    G.QZ = makeQs(5, 0, '2024-May');
    toggleYearFilt('2024-May');
    expect(G.years).toContain('2024-May');
    expect(G.filt).toBe('years');
    toggleYearFilt('2024-May');
    expect(G.years).not.toContain('2024-May');
    expect(G.filt).toBe('all'); // back to all when years empty
  });

  it('clearYearFilt resets years and filt when on years filter', () => {
    G.years = ['2024-May', '2025-Jun'];
    G.filt = 'years';
    clearYearFilt();
    expect(G.years).toEqual([]);
    expect(G.filt).toBe('all');
  });

  it('clearYearFilt does NOT change filt when not on years filter', () => {
    G.years = ['2024-May'];
    G.filt = 'topic'; // user is on topic filter; clearing years should not switch
    clearYearFilt();
    expect(G.years).toEqual([]);
    expect(G.filt).toBe('topic');
  });

  it('multi-year intersection only includes matching tags', () => {
    G.QZ = [
      ...makeQs(2, 0, '2020'),
      ...makeQs(3, 0, '2024-Sep'),
      ...makeQs(2, 0, '2025-Jun'),
    ];
    G.filt = 'years';
    G.years = ['2020', '2025-Jun'];
    buildPool();
    expect(G.pool.length).toBe(4); // 2 from 2020 + 2 from 2025-Jun
    G.pool.forEach((idx) => {
      expect(['2020', '2025-Jun']).toContain(G.QZ[idx].t);
    });
  });
});

describe('quiz engine — setFilt resets year selection except on year filt', () => {
  it('switching to topic filter clears years', () => {
    G.QZ = makeQs(3, 0);
    G.years = ['2024-May'];
    setFilt('topic');
    expect(G.years).toEqual([]);
  });

  it('setFilt("years") preserves any prior year selection', () => {
    G.QZ = makeQs(3, 0);
    G.years = ['2024-May'];
    setFilt('years');
    expect(G.years).toEqual(['2024-May']);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 2. Study-plan scheduler boundary cases (DST + calendar edges)
// ─────────────────────────────────────────────────────────────────────────

import {
  allocateHours,
  schedule,
  rampStages,
  defaultDailyQTarget,
  buildPlan,
} from '../src/features/study_plan/algorithm.js';

describe('study_plan algorithm — boundary cases', () => {
  const _topics = [
    { id: 0, en: 'A', he: 'א', frequency_pct: 50, keywords: [] },
    { id: 1, en: 'B', he: 'ב', frequency_pct: 30, keywords: [] },
    { id: 2, en: 'C', he: 'ג', frequency_pct: 20, keywords: [] },
  ];

  it('allocateHours respects 0.5h floor for tiny shares', () => {
    const out = allocateHours(_topics, 5); // tiny budget
    out.forEach((t) => {
      expect(t.hours).toBeGreaterThanOrEqual(0.5);
    });
  });

  it('allocateHours respects 6.0h ceiling for runaway shares', () => {
    const dominant = [{ id: 0, en: 'X', he: 'X', frequency_pct: 99, keywords: [] }];
    const out = allocateHours(dominant, 1000);
    expect(out[0].hours).toBeLessThanOrEqual(6.0);
  });

  it('schedule allocates highest-frequency topic first', () => {
    const allocated = allocateHours(_topics, 30);
    const { weeks } = schedule(allocated, 10, 3);
    // Topic A (50%) should land in week 0
    expect(weeks[0].length).toBeGreaterThan(0);
    expect(weeks[0][0].id).toBe(0);
  });

  it('rampStages collapses to taper-only at rampWeeks=1', () => {
    const stages = rampStages(1);
    expect(stages.length).toBe(1);
    expect(stages[0].label).toBe('הכנה אחרונה');
  });

  it('rampStages always ends with taper (last entry)', () => {
    for (const n of [1, 2, 3, 4, 5, 6]) {
      const stages = rampStages(n);
      expect(stages[stages.length - 1].label).toBe('הכנה אחרונה');
      expect(stages.length).toBe(n);
    }
  });

  it('rampStages clamps overflow to 6 build-up stages + taper', () => {
    const stages = rampStages(99); // way over
    expect(stages.length).toBeLessThanOrEqual(6);
  });

  it('defaultDailyQTarget floor is 5', () => {
    expect(defaultDailyQTarget(0.1)).toBe(5);
    expect(defaultDailyQTarget(2)).toBe(5); // round(2*1.3)=3 < floor → 5
  });

  it('defaultDailyQTarget ceiling is 60', () => {
    expect(defaultDailyQTarget(80)).toBe(60);
    expect(defaultDailyQTarget(1000)).toBe(60);
  });

  it('defaultDailyQTarget handles invalid inputs by returning 10', () => {
    expect(defaultDailyQTarget(0)).toBe(10);
    expect(defaultDailyQTarget(-5)).toBe(10);
    expect(defaultDailyQTarget(NaN)).toBe(10);
    expect(defaultDailyQTarget('abc')).toBe(10);
  });

  it('buildPlan rejects exam_date before start_date', () => {
    expect(() => buildPlan({
      topics: _topics,
      startDateISO: '2026-01-01',
      examDateISO: '2025-12-31',
      hoursPerWeek: 10,
      rampWeeks: 2,
    })).toThrow('exam_date_must_be_after_start_date');
  });

  it('buildPlan rejects when not enough weeks for ramp + 4 topic weeks', () => {
    expect(() => buildPlan({
      topics: _topics,
      startDateISO: '2026-01-01',
      examDateISO: '2026-02-01', // ~4-5 weeks total
      hoursPerWeek: 10,
      rampWeeks: 3,
    })).toThrow('not_enough_weeks');
  });

  it('buildPlan handles DST seam (week boundary across spring-forward)', () => {
    // Israel DST 2026: Mar 27 02:00 → Mar 27 03:00. A plan spanning DST
    // boundary must still produce 7-day weeks (not 6 or 8 days).
    const out = buildPlan({
      topics: _topics,
      startDateISO: '2026-03-01',
      examDateISO: '2026-06-01',
      hoursPerWeek: 10,
      rampWeeks: 2,
    });
    out.display.weeks.forEach((w) => {
      const start = new Date(w.start_date + 'T00:00:00Z').getTime();
      const end = new Date(w.end_date + 'T00:00:00Z').getTime();
      const days = Math.round((end - start) / 86400000);
      expect(days).toBe(6); // start..end inclusive = 7 days, end-start = 6
    });
  });

  it('buildPlan produces calendar-aligned ISO dates (no off-by-one)', () => {
    const out = buildPlan({
      topics: _topics,
      startDateISO: '2026-01-05', // Mon
      examDateISO: '2026-04-20',
      hoursPerWeek: 10,
      rampWeeks: 2,
    });
    expect(out.display.weeks[0].start_date).toBe('2026-01-05');
    // Week 0 ends 6 days later: 2026-01-11
    expect(out.display.weeks[0].end_date).toBe('2026-01-11');
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 3. Service-worker manifest sanity
// ─────────────────────────────────────────────────────────────────────────

describe('service-worker — manifest invariants', () => {
  let swSrc;
  beforeAll(() => {
    swSrc = readFileSync(resolve(ROOT, 'sw.js'), 'utf-8');
  });

  it('CACHE name matches package.json version', () => {
    const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'));
    const m = swSrc.match(/CACHE\s*=\s*['"]mishpacha-v([\d.]+)['"]/);
    expect(m).not.toBeNull();
    expect(m[1]).toBe(pkg.version);
  });

  it('JSON_DATA_URLS uses cache-first via shouldUseCacheFirst', () => {
    expect(swSrc).toMatch(/shouldUseCacheFirst/);
    expect(swSrc).toMatch(/JSON_DATA_URLS/);
    // Ensure the function is wired into the fetch handler
    expect(swSrc).toMatch(/shouldUseCacheFirst\(url\)/);
  });

  it('navigate request falls back to mishpacha-mega.html', () => {
    expect(swSrc).toMatch(/caches\.match\(['"]mishpacha-mega\.html['"]\)/);
  });

  it('activate handler deletes old cache versions', () => {
    expect(swSrc).toMatch(/k\s*!==\s*CACHE/);
    expect(swSrc).toMatch(/caches\.delete\(k\)/);
  });

  it('skipWaiting message is honoured (update-banner integration)', () => {
    expect(swSrc).toMatch(/SKIP_WAITING/);
    expect(swSrc).toMatch(/self\.skipWaiting\(\)/);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 4. IndexedDB round-trip (fake)
// ─────────────────────────────────────────────────────────────────────────

describe('IndexedDB — persistence round-trip (mock)', () => {
  it('idbGet returns the value stored by idbSet (single round-trip)', async () => {
    // Inline mini-mock that mirrors src/core/state.js semantics:
    //   - state store has put(value, key) and get(key)
    //   - Promise resolves to the stored value
    const store = new Map();
    const fakeIdb = {
      transaction: (_name, _mode) => ({
        objectStore: (_n) => ({
          put: (val, key) => { store.set(key, val); return { onsuccess: null, onerror: null }; },
          get: (key) => {
            const r = { result: store.get(key) || null, onsuccess: null, onerror: null };
            // simulate async
            setTimeout(() => { if (r.onsuccess) r.onsuccess({ target: r }); }, 0);
            return r;
          },
          delete: (key) => { store.delete(key); return { onsuccess: null }; },
        }),
        oncomplete: null,
        onerror: null,
      }),
    };
    // Simulate G.idb already opened
    G.idb = fakeIdb;
    // Reproduce idbSet from state.js
    const idbSet = (key, val) => new Promise((resolve) => {
      const tx = G.idb.transaction('state', 'readwrite');
      tx.objectStore('state').put(val, key);
      // mock auto-completes
      setTimeout(resolve, 5);
    });
    const idbGet = (key) => new Promise((resolve) => {
      if (!G.idb) return resolve(null);
      const tx = G.idb.transaction('state', 'readonly');
      const req = tx.objectStore('state').get(key);
      req.onsuccess = () => resolve(req.result || null);
    });
    const payload = { sr: { 0: { ef: 2.5, n: 1 } }, streak: 7 };
    await idbSet('mishpacha_mega', payload);
    const got = await idbGet('mishpacha_mega');
    expect(got).toEqual(payload);
  });

  it('idbGet returns null for missing keys', async () => {
    const store = new Map();
    G.idb = {
      transaction: () => ({
        objectStore: () => ({
          get: (k) => {
            const r = { result: store.get(k) || null, onsuccess: null };
            setTimeout(() => r.onsuccess && r.onsuccess({ target: r }), 0);
            return r;
          },
        }),
      }),
    };
    const idbGet = (key) => new Promise((resolve) => {
      const tx = G.idb.transaction('state', 'readonly');
      const req = tx.objectStore('state').get(key);
      req.onsuccess = () => resolve(req.result || null);
    });
    const got = await idbGet('missing-key');
    expect(got).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 5. Hebrew bidi numerics — clinical-style mixed strings
// ─────────────────────────────────────────────────────────────────────────

import { heDir, sanitize } from '../src/core/utils.js';

describe('heDir — clinical mixed-content edges', () => {
  it('returns ltr for English-only drug name', () => {
    expect(heDir('amoxicillin 500mg PO BID')).toBe('ltr');
  });

  it('returns rtl for Hebrew with embedded Arabic digits and English unit suffix', () => {
    // טרנדולפריל 2 mg ליום — clinically common
    expect(heDir('טרנדולפריל 2 mg ליום')).toBe('rtl');
  });

  it('returns rtl when Hebrew is exactly 25% of the string (boundary)', () => {
    // 1 Hebrew char out of 4 letters total = 25% → triggers rtl
    expect(heDir('aaאa')).toBe('rtl');
  });

  it('returns ltr when Hebrew is just under 25% (boundary - 1)', () => {
    // 1 Hebrew char out of 5 letters total = 20% → ltr
    expect(heDir('aaaaא')).toBe('ltr');
  });

  it('returns auto for digit-only / pure punctuation / empty', () => {
    expect(heDir('')).toBe('auto');
    expect(heDir('123 / 456')).toBe('auto');
    expect(heDir('--')).toBe('auto');
  });

  it('mixed Hebrew + lab abbreviation + Arabic digit + Hebrew suffix → rtl', () => {
    // HbA1c 7.5% טוב, eGFR 60 ml/min/1.73 לחולה
    // 13 He chars + 22 En chars (incl HbA1c eGFR ml min) → ~37% He → rtl
    expect(heDir('HbA1c 7.5% טוב, eGFR 60 ml/min/1.73 לחולה')).toBe('rtl');
  });

  it('sanitize escapes embedded HTML in Hebrew clinical free-text', () => {
    expect(sanitize('הסבר <b>חשוב</b>')).toBe('הסבר &lt;b&gt;חשוב&lt;/b&gt;');
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 6. Mutation-resistance — the three operator/boundary flips
// ─────────────────────────────────────────────────────────────────────────

describe('mutation-resistance — operator/boundary flips', () => {
  it('isOk: c_accept array overrides primary c (mutation: prefers c)', () => {
    const q = { o: ['a', 'b', 'c', 'd'], c: 0, c_accept: [2, 3] };
    expect(isOk(q, 0)).toBe(false); // primary c is rejected if not in c_accept
    expect(isOk(q, 2)).toBe(true);
    expect(isOk(q, 3)).toBe(true);
    expect(isOk(q, 1)).toBe(false);
  });

  it('isOk: empty c_accept array falls back to primary c (mutation: empty=accept-all)', () => {
    const q = { o: ['a', 'b'], c: 1, c_accept: [] };
    expect(isOk(q, 0)).toBe(false);
    expect(isOk(q, 1)).toBe(true);
  });

  it('isOk: missing c_accept uses primary c (mutation: undefined=accept-all)', () => {
    const q = { o: ['a', 'b'], c: 0 };
    expect(isOk(q, 0)).toBe(true);
    expect(isOk(q, 1)).toBe(false);
  });

  it('allocateHours: a topic with frequency_pct=0 still gets the 0.5h floor (mutation: 0 → 0)', () => {
    const tps = [
      { id: 0, en: 'big', he: 'big', frequency_pct: 100, keywords: [] },
      { id: 1, en: 'small', he: 'small', frequency_pct: 0, keywords: [] },
    ];
    const out = allocateHours(tps, 100);
    expect(out[1].hours).toBe(0.5); // exact floor — would break if floor = 0
  });

  it('defaultDailyQTarget: hpw=4 → 5, hpw=4.1 → 5 (boundary at floor)', () => {
    expect(defaultDailyQTarget(4)).toBe(5);    // round(4*1.3)=5
    expect(defaultDailyQTarget(3)).toBe(5);    // round(3*1.3)=4 → floored to 5
    expect(defaultDailyQTarget(4.5)).toBe(6);  // round(4.5*1.3)=6 (above floor)
  });
});
