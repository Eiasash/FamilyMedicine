/**
 * Tests for navigation and exam-mode helpers in src/quiz/engine.js:
 *   setFilt, setTopicFilt, toggleYearFilt, clearYearFilt
 *   pick, check, next, prev
 *   _storeDiff, checkMockIntercept
 *   buildMockExamPool
 *   replayMockWrong, replayLastMockWrong
 *
 * Heavy transitive imports are mocked. buildPool is also called by these
 * functions; we let it run (it's pure G.* manipulation) but we pre-configure
 * the mock so getDueQuestions / getTopicStats don't throw.
 */

import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';

globalThis.window = globalThis;

const _lsStore = new Map();
globalThis.localStorage = {
  getItem: (k) => (_lsStore.has(k) ? _lsStore.get(k) : null),
  setItem: (k, v) => _lsStore.set(k, String(v)),
  removeItem: (k) => _lsStore.delete(k),
  clear: () => _lsStore.clear(),
};

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
import { srScore } from '../src/sr/spaced-repetition.js';

let setFilt, setTopicFilt, toggleYearFilt, clearYearFilt;
let pick, check, next, prev;
let _storeDiff, checkMockIntercept;
let buildMockExamPool;
let replayMockWrong, replayLastMockWrong;

beforeAll(async () => {
  const mod = await import('../src/quiz/engine.js');
  setFilt = mod.setFilt;
  setTopicFilt = mod.setTopicFilt;
  toggleYearFilt = mod.toggleYearFilt;
  clearYearFilt = mod.clearYearFilt;
  pick = mod.pick;
  check = mod.check;
  next = mod.next;
  prev = mod.prev;
  _storeDiff = mod._storeDiff;
  checkMockIntercept = mod.checkMockIntercept;
  buildMockExamPool = mod.buildMockExamPool;
  replayMockWrong = mod.replayMockWrong;
  replayLastMockWrong = mod.replayLastMockWrong;
});

function installDomShim() {
  globalThis.document = {
    getElementById: () => null,
    createElement: () => ({
      id: '', innerHTML: '', style: {},
      addEventListener: () => {},
    }),
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
  G.pool = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  G.qi = 0;
  G.sel = null;
  G.ans = false;
  G.filt = 'all';
  G.topicFilt = -1;
  G.years = [];
  G.examMode = false;
  G.mockExamResults = null;
  G._mockAnswered = 0;
  G.examTimer = null;
  G.render = vi.fn();
  G.save = vi.fn();
  G._exCache = {};
  G._sessAnsw = {};
  G._confidence = null;
  G._wrongReason = null;
  G._diffRating = null;
  G.autopsyDistractor = -1;
  G.teachBackState = null;
  G._optShuffle = null;
  G.timedMode = false;
  G.qStartTime = Date.now();
  G._sessionOk = 0;
  G._sessionNo = 0;
  G._sessionBest = {};
  G._sessionWorse = {};
  srScore.mockReset();
});

// ---- setFilt ----------------------------------------------------------------

describe('setFilt', () => {
  it('updates G.filt, resets topicFilt and years, then renders', () => {
    G.topicFilt = 5;
    G.years = ['2024-May'];
    setFilt('hard');
    expect(G.filt).toBe('hard');
    expect(G.topicFilt).toBe(-1);
    expect(G.years).toEqual([]);
    expect(G.render).toHaveBeenCalledTimes(1);
  });

  it('preserves years[] when switching to "years" filter', () => {
    // The engine only clears years if f !== 'years'
    G.years = ['2023-Jun'];
    setFilt('years');
    expect(G.filt).toBe('years');
    expect(G.years).toEqual(['2023-Jun']);
  });
});

// ---- setTopicFilt -----------------------------------------------------------

describe('setTopicFilt', () => {
  it('sets filt to "topic" and topicFilt to the given ti', () => {
    setTopicFilt(3);
    expect(G.filt).toBe('topic');
    expect(G.topicFilt).toBe(3);
    expect(G.years).toEqual([]);
    expect(G.render).toHaveBeenCalled();
  });
});

// ---- toggleYearFilt / clearYearFilt ----------------------------------------

describe('toggleYearFilt', () => {
  it('adds a valid exam year to G.years and sets filt to "years"', () => {
    toggleYearFilt('2024-May');
    expect(G.years).toContain('2024-May');
    expect(G.filt).toBe('years');
  });

  it('removes the year on a second toggle (deselect)', () => {
    toggleYearFilt('2024-May');
    toggleYearFilt('2024-May');
    expect(G.years).not.toContain('2024-May');
    expect(G.filt).toBe('all'); // empty years → back to 'all'
  });

  it('silently ignores unknown year tokens', () => {
    toggleYearFilt('9999-XX');
    expect(G.years).toEqual([]);
    expect(G.filt).toBe('all');
    expect(G.render).not.toHaveBeenCalled();
  });

  it('resets topicFilt when a year is added', () => {
    G.topicFilt = 4;
    toggleYearFilt('2023-Jun');
    expect(G.topicFilt).toBe(-1);
  });
});

describe('clearYearFilt', () => {
  it('clears all selected years and reverts filt to "all"', () => {
    G.years = ['2024-May', '2023-Jun'];
    G.filt = 'years';
    clearYearFilt();
    expect(G.years).toEqual([]);
    expect(G.filt).toBe('all');
    expect(G.render).toHaveBeenCalled();
  });

  it('does not change filt when it was already not "years"', () => {
    G.years = ['2024-May'];
    G.filt = 'hard';
    clearYearFilt();
    expect(G.filt).toBe('hard');
  });
});

// ---- pick -------------------------------------------------------------------

describe('pick', () => {
  it('sets G.sel to the chosen option index', () => {
    pick(2);
    expect(G.sel).toBe(2);
  });

  it('calls G.render after picking', () => {
    pick(1);
    expect(G.render).toHaveBeenCalledTimes(1);
  });

  it('ignores pick() when the question has already been answered', () => {
    G.ans = true;
    G.sel = 3;
    pick(1);
    expect(G.sel).toBe(3); // unchanged
    expect(G.render).not.toHaveBeenCalled();
  });
});

// ---- check ------------------------------------------------------------------

describe('check', () => {
  it('no-ops when sel is null', () => {
    G.sel = null;
    check();
    expect(G.ans).toBe(false);
    expect(srScore).not.toHaveBeenCalled();
  });

  it('marks correct answer: increments qOk and calls srScore(true)', () => {
    G.QZ[0] = { ti: 0, q: 'Q', o: ['a', 'b', 'c', 'd'], c: 2, t: '2024-May' };
    G.pool = [0]; G.qi = 0; G.sel = 2;
    check();
    expect(G.ans).toBe(true);
    expect(G.S.qOk).toBe(1);
    expect(G.S.qNo).toBe(0);
    expect(srScore).toHaveBeenCalledWith(0, true);
  });

  it('marks wrong answer: increments qNo and calls srScore(false)', () => {
    G.QZ[0] = { ti: 0, q: 'Q', o: ['a', 'b', 'c', 'd'], c: 2, t: '2024-May' };
    G.pool = [0]; G.qi = 0; G.sel = 1; // wrong answer
    check();
    expect(G.ans).toBe(true);
    expect(G.S.qOk).toBe(0);
    expect(G.S.qNo).toBe(1);
    expect(srScore).toHaveBeenCalledWith(0, false);
  });

  it('stores wrong-choice counter in sr.wc', () => {
    G.QZ[0] = { ti: 0, q: 'Q', o: ['a', 'b', 'c', 'd'], c: 2, t: '2024-May' };
    G.pool = [0]; G.qi = 0; G.sel = 3; // wrong
    check();
    expect(G.S.sr[0]).toBeDefined();
    expect(G.S.sr[0].wc).toBeDefined();
    expect(G.S.sr[0].wc['3']).toBe(1);
  });

  it('stores confidence into sr.conf when G._confidence is set', () => {
    G.QZ[0] = { ti: 0, q: 'Q', o: ['a', 'b', 'c', 'd'], c: 1, t: '2024-May' };
    G.pool = [0]; G.qi = 0; G.sel = 1; G._confidence = 3; // sure + correct
    check();
    expect(G.S.sr[0].conf.sure_ok).toBe(1);
  });
});

// ---- next -------------------------------------------------------------------

describe('next', () => {
  it('advances G.qi by 1 and resets answer state', () => {
    G.qi = 2; G.sel = 1; G.ans = true;
    next();
    expect(G.qi).toBe(3);
    expect(G.sel).toBeNull();
    expect(G.ans).toBe(false);
    expect(G.render).toHaveBeenCalled();
  });

  it('wraps G.qi back to 0 when past pool end', () => {
    G.pool = [0, 1, 2]; G.qi = 2;
    next();
    expect(G.qi).toBe(0);
  });

  it('saves the current answer in _sessAnsw when an answer is set', () => {
    G.pool = [0, 1, 2, 3]; G.qi = 1; G.ans = true; G.sel = 2; G._confidence = 3;
    next();
    expect(G._sessAnsw[1]).toEqual({ sel: 2, ans: true, conf: 3 });
  });

  it('clears auxiliary answer-state fields', () => {
    G._optShuffle = { qIdx: 1, map: [0, 1, 2, 3] };
    G._confidence = 2;
    G.autopsyDistractor = 1;
    G.teachBackState = { score: 3 };
    next();
    expect(G._optShuffle).toBeNull();
    expect(G._confidence).toBeNull();
    expect(G.autopsyDistractor).toBe(-1);
    expect(G.teachBackState).toBeNull();
  });
});

// ---- prev -------------------------------------------------------------------

describe('prev', () => {
  it('no-ops when qi is 0', () => {
    G.qi = 0;
    prev();
    expect(G.qi).toBe(0);
    expect(G.render).not.toHaveBeenCalled();
  });

  it('no-ops in exam mode', () => {
    G.examMode = true; G.qi = 3;
    prev();
    expect(G.qi).toBe(3);
    expect(G.render).not.toHaveBeenCalled();
  });

  it('decrements qi and restores a previously saved answer', () => {
    G.pool = [0, 1, 2]; G.qi = 2;
    G._sessAnsw = { 1: { sel: 3, ans: true, conf: 2 } };
    prev();
    expect(G.qi).toBe(1);
    expect(G.sel).toBe(3);
    expect(G.ans).toBe(true);
    expect(G._confidence).toBe(2);
    expect(G.render).toHaveBeenCalled();
  });

  it('clears answer state when no saved answer exists for the previous question', () => {
    G.pool = [0, 1, 2]; G.qi = 2; G._sessAnsw = {};
    prev();
    expect(G.sel).toBeNull();
    expect(G.ans).toBe(false);
  });
});

// ---- _storeDiff -------------------------------------------------------------

describe('_storeDiff', () => {
  it('initialises an sr entry for a fresh question and stores difficulty', () => {
    _storeDiff(5, 3);
    expect(G.S.sr[5]).toBeDefined();
    expect(G.S.sr[5].diff).toBe(3);
    expect(G.save).toHaveBeenCalledTimes(1);
  });

  it('updates diff on an existing sr entry without overwriting other fields', () => {
    G.S.sr[5] = { ef: 2.1, n: 2, next: 99999, tot: 3, ok: 2 };
    _storeDiff(5, 1);
    expect(G.S.sr[5].diff).toBe(1);
    expect(G.S.sr[5].ef).toBe(2.1); // unchanged
  });
});

// ---- checkMockIntercept ----------------------------------------------------

describe('checkMockIntercept', () => {
  it('no-ops when G.ans is already true', () => {
    G.ans = true;
    G.mockExamResults = { byTopic: { 0: { ok: 0, no: 0 } } };
    G.QZ[0] = { ti: 0, q: 'Q', o: ['a','b','c','d'], c: 0, t: '2024-May' };
    G.pool = [0]; G.qi = 0; G.sel = 0;
    checkMockIntercept();
    expect(G.mockExamResults.byTopic[0].ok).toBe(0); // not incremented
  });

  it('no-ops when sel is null', () => {
    G.sel = null;
    G.mockExamResults = { byTopic: { 0: { ok: 0, no: 0 } } };
    checkMockIntercept();
    expect(G.mockExamResults.byTopic[0].ok).toBe(0);
  });

  it('increments byTopic.ok on a correct answer', () => {
    G.QZ[0] = { ti: 0, q: 'Q', o: ['a','b','c','d'], c: 2, t: '2024-May' };
    G.pool = [0]; G.qi = 0; G.sel = 2; G.ans = false;
    G.mockExamResults = { byTopic: { 0: { ok: 0, no: 0 } } };
    G._mockAnswered = 0;
    checkMockIntercept();
    expect(G.mockExamResults.byTopic[0].ok).toBe(1);
    expect(G.mockExamResults.byTopic[0].no).toBe(0);
    expect(G._mockAnswered).toBe(1);
  });

  it('increments byTopic.no on a wrong answer and appends to wrongIdxs', () => {
    G.QZ[0] = { ti: 0, q: 'Q', o: ['a','b','c','d'], c: 2, t: '2024-May' };
    G.pool = [0]; G.qi = 0; G.sel = 1; G.ans = false; // wrong
    G.mockExamResults = { byTopic: { 0: { ok: 0, no: 0 } } };
    G._mockAnswered = 0;
    checkMockIntercept();
    expect(G.mockExamResults.byTopic[0].no).toBe(1);
    expect(G.mockExamResults.wrongIdxs).toContain(0);
  });
});

// ---- buildMockExamPool ------------------------------------------------------

describe('buildMockExamPool', () => {
  beforeEach(() => {
    // Build a rich QZ so every topic bucket has plenty of questions.
    G.QZ = [];
    for (let ti = 0; ti < 27; ti++) {
      for (let j = 0; j < 10; j++) {
        G.QZ.push({ ti, q: `t${ti}-q${j}`, o: ['a','b','c','d'], c: 0, t: '2024-May' });
      }
    }
  });

  it('returns at most the requested size (may be smaller if topic buckets are exhausted)', () => {
    const pool = buildMockExamPool(150);
    expect(pool.length).toBeLessThanOrEqual(150);
    expect(pool.length).toBeGreaterThan(0);
  });

  it('defaults to 150 as the target when no size is given', () => {
    const pool = buildMockExamPool();
    expect(pool.length).toBeLessThanOrEqual(150);
    expect(pool.length).toBeGreaterThan(0);
  });

  it('contains only valid indices into G.QZ', () => {
    const pool = buildMockExamPool(100);
    for (const idx of pool) {
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(G.QZ.length);
    }
  });

  it('produces no duplicate indices', () => {
    const pool = buildMockExamPool(100);
    expect(new Set(pool).size).toBe(pool.length);
  });

  it('includes questions from multiple topics (realistic distribution)', () => {
    const pool = buildMockExamPool(150);
    const topics = new Set(pool.map((i) => G.QZ[i].ti));
    expect(topics.size).toBeGreaterThan(5);
  });
});

// ---- replayMockWrong / replayLastMockWrong ----------------------------------

describe('replayMockWrong', () => {
  it('sets G.pool to the provided wrong indices and enters custom mode', () => {
    replayMockWrong([0, 3, 7]);
    expect(G.pool).toEqual([0, 3, 7]);
    expect(G.filt).toBe('custom');
    expect(G.examMode).toBe(false);
    expect(G.mockExamResults).toBeNull();
    expect(G.render).toHaveBeenCalled();
  });

  it('resets cursor state', () => {
    G.qi = 5; G.sel = 2; G.ans = true;
    replayMockWrong([1, 2]);
    expect(G.qi).toBe(0);
    expect(G.sel).toBeNull();
    expect(G.ans).toBe(false);
  });

  it('no-ops for an empty or non-array input', () => {
    G.pool = [99]; G.filt = 'all';
    replayMockWrong([]);
    expect(G.pool).toEqual([99]);
    replayMockWrong(null);
    expect(G.pool).toEqual([99]);
  });
});

describe('replayLastMockWrong', () => {
  it('replays the wrong indices from the most recent mock-exam history entry', () => {
    const hist = [
      { score: 80, wrongIdxs: [1, 2, 3] },
      { score: 60, wrongIdxs: [4, 5, 6] },
    ];
    localStorage.setItem('mishpacha_mock_hist', JSON.stringify(hist));
    replayLastMockWrong();
    expect(G.pool).toEqual([4, 5, 6]);
    expect(G.filt).toBe('custom');
  });

  it('no-ops when history is empty', () => {
    G.pool = [77];
    localStorage.setItem('mishpacha_mock_hist', '[]');
    replayLastMockWrong();
    expect(G.pool).toEqual([77]); // unchanged
  });

  it('no-ops when the last entry has no wrongIdxs', () => {
    G.pool = [88];
    const hist = [{ score: 90, wrongIdxs: [] }];
    localStorage.setItem('mishpacha_mock_hist', JSON.stringify(hist));
    replayLastMockWrong();
    expect(G.pool).toEqual([88]);
  });

  it('handles corrupt localStorage gracefully', () => {
    localStorage.setItem('mishpacha_mock_hist', '{broken');
    expect(() => replayLastMockWrong()).not.toThrow();
  });
});
