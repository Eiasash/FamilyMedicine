// @vitest-environment jsdom
//
// Regression guard for the single most important flow in the app: answering a
// question. A user reported "it selects but בדוק (Check) does nothing"; that
// turned out to be a stale cached bundle, but there was no automated proof the
// flow worked end-to-end. This test renders the quiz into a real DOM, clicks an
// option via the live event delegation (initQuizEvents), clicks Check, and
// asserts the answer locks and the post-answer UI renders. Exam (סימולציה) mode
// is used because it skips the home-screen widgets (daily contract / filter
// controls) and exercises the same pick→check→render pipeline directly.
import { describe, it, expect, beforeAll, vi } from 'vitest';

vi.mock('../src/sr/spaced-repetition.js', () => ({
  getDueQuestions: vi.fn(() => []), getTopicStats: vi.fn(() => ({})),
  isExamTrap: vi.fn(() => false), srScore: vi.fn(), buildRescuePool: vi.fn(),
}));
vi.mock('../src/ai/client.js', () => ({ callAI: vi.fn() }));
vi.mock('../src/ai/explain.js', () => ({ aiAutopsy: vi.fn(), renderExplainBox: vi.fn() }));

import G from '../src/core/globals.js';

describe('quiz answer flow: pick → check (the בדוק button)', () => {
  let qv;
  beforeAll(async () => { qv = await import('../src/ui/quiz-view.js'); });

  it('selecting an option then clicking בדוק locks the answer and reveals Next', () => {
    document.body.innerHTML = '<div id="ct"></div>';
    G.QZ = [{ q: 'Q?', o: ['A', 'B', 'C', 'D'], c: 1, e: 'exp', ti: -1, t: '2025-Jun' }];
    G.pool = [0]; G.qi = 0; G.sel = null; G.ans = false;
    G.examMode = true; G.mockExamResults = null;
    G.S = { sr: {}, bk: {}, flagged: {}, qnotes: {}, qOk: 0, qNo: 0 };
    G._exCache = {}; G.save = () => {};
    const ct = document.getElementById('ct');
    G.render = () => { ct.innerHTML = qv.renderQuiz(); };
    qv.initQuizEvents(ct);
    G.render();

    const click = (el) => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

    // pick option B (origI=1) through the real delegated handler
    const optB = ct.querySelector('[data-action="pick"][data-i="1"]');
    expect(optB, 'option button renders').toBeTruthy();
    click(optB);
    expect(G.sel, 'pick() set the selection').toBe(1);

    // the בדוק button must be present and enabled once an option is picked
    const checkBtn = ct.querySelector('[data-action="check-answer"]');
    expect(checkBtn, 'Check button renders').toBeTruthy();
    expect(checkBtn.disabled, 'Check is enabled after a pick').toBe(false);

    // clicking Check must lock the answer and advance the UI
    click(checkBtn);
    expect(G.ans, 'check() locked the answer').toBe(true);
    expect(ct.querySelector('[data-action="next-q"]'), 'Next button appears after Check').toBeTruthy();
  });
});
