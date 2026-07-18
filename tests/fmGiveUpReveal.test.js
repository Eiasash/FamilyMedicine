/**
 * FM-3 (2026-07-15): give-up ("לא יודע") / timed-timeout must render the
 * INCORRECT feedback panel for a missed question and record the miss — never
 * the green "correct" panel.
 *
 * The old code set G.sel=q.c then scored wrong, so renderQuiz showed
 * quiz-feedback--ok ("נכון") for a question the user never answered. The fix
 * reveals the correct option via a transient G._reveal flag WITHOUT assigning
 * it to G.sel, forces the incorrect variant, and routes scoring through
 * srScore(false) + markWrong().
 *
 * Bootstrap: fsrs seed (so the real srScore runs) + manual DOM/localStorage
 * shims, mirroring srScore.test.js and quizViewMarkup.test.js.
 */
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

globalThis.window = globalThis;
const fsrsSrc = readFileSync(resolve(process.cwd(), 'shared', 'fsrs.js'), 'utf-8');
const seed = new Function(
  'target',
  fsrsSrc +
    ';Object.assign(target, { FSRS_W, FSRS_DECAY, FSRS_FACTOR, FSRS_RETENTION,' +
    ' fsrsR, fsrsInterval, fsrsInitNew, fsrsUpdate, fsrsMigrateFromSM2, isChronicFail });'
);
seed(globalThis);

const _lsStore = new Map();
globalThis.localStorage = {
  getItem: (k) => (_lsStore.has(k) ? _lsStore.get(k) : null),
  setItem: (k, v) => _lsStore.set(k, String(v)),
  removeItem: (k) => _lsStore.delete(k),
  clear: () => _lsStore.clear(),
};
globalThis.document = {
  getElementById: () => null,
  querySelector: () => null,
  addEventListener: () => {},
  createElement: () => ({ style: {}, classList: { add() {}, remove() {} } }),
};

let G, showAnswerHardFail, renderQuiz, getWrongSet;
beforeAll(async () => {
  G = (await import('../src/core/globals.js')).default;
  showAnswerHardFail = (await import('../src/ui/more-view.js')).showAnswerHardFail;
  renderQuiz = (await import('../src/ui/quiz-view.js')).renderQuiz;
  getWrongSet = (await import('../src/quiz/wrong-review.js')).getWrongSet;
});

function seedG() {
  G.QZ = [{
    q: 'A missed question stem?',
    o: ['Alpha', 'Bravo', 'Charlie', 'Delta'],
    c: 2, // correct = index 2 (Charlie)
    ti: 1,
    t: '2024-Sep',
    e: 'Charlie is correct because reasons.',
  }];
  G.pool = [0]; G.qi = 0;
  G.sel = null; G.ans = false; G._reveal = false;
  G.examMode = false; G.timedMode = false; G.blindRecall = false;
  G.autopsyMode = false; G.autopsyDistractor = -1;
  G.filt = 'all'; G.years = []; G.topicFilt = -1;
  G.teachBackState = null; G._wrongReason = null; G._diffRating = null;
  G._exCache = {};
  G.S = {
    qOk: 0, qNo: 0, bk: {}, qnotes: {}, sr: {}, flagged: {}, chat: [],
    wrongSet: {}, dailyAct: {}, streak: 0,
    dailyContract: { date: new Date().toISOString().slice(0, 10), dismissed: true },
  };
  G.DIS = {}; G.NOTES_BY_TI = {};
  G._sessionOk = 0; G._sessionNo = 0; G._sessionBest = {}; G._sessionWorse = {};
  G.qStartTime = Date.now() - 3000;
  G.render = vi.fn(); G.save = vi.fn();
}

beforeEach(() => seedG());

describe('FM-3: give-up reveal records a miss and shows the incorrect panel', () => {
  it('does NOT assign the correct answer to G.sel and sets the reveal flag', () => {
    showAnswerHardFail();
    expect(G.ans).toBe(true);
    expect(G._reveal).toBe(true);
    expect(G.sel).toBeNull();
    expect(G.sel).not.toBe(2); // must never equal q.c (the old bug)
  });

  it('records the wrong via srScore(false) + markWrong()', () => {
    showAnswerHardFail();
    const s = G.S.sr[0];
    expect(s).toBeDefined();
    expect(s.tot).toBe(1);
    expect(s.ok).toBe(0);
    expect(G.S.qNo).toBe(1);
    expect(getWrongSet()['0']).toBeDefined();
  });

  it('renderQuiz shows the INCORRECT feedback panel, not the correct one', () => {
    showAnswerHardFail();
    const html = renderQuiz();
    expect(html).toContain('quiz-feedback--err');
    expect(html).toContain('לא נכון');
    expect(html).not.toContain('quiz-feedback quiz-feedback--ok');
    // The correct option is still revealed (highlighted) — without a "you picked it" state.
    expect(html).toContain('data-state="correct-unchosen"');
  });

  it('the shared reveal render state (sel=null, _reveal=true) forces the err variant', () => {
    // This is exactly the state produced by BOTH give-up and the timed timeout.
    G.sel = null; G._reveal = true; G.ans = true;
    const html = renderQuiz();
    expect(html).toContain('quiz-feedback--err');
    expect(html).not.toContain('quiz-feedback quiz-feedback--ok');
  });
});
