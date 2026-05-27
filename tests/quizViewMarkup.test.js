/**
 * Tests for the v1.15.0 Quiz tab rebuild (src/ui/quiz-view.js).
 *
 * The PR replaces the entire main renderQuiz() markup with semantic,
 * class-driven HTML and ZERO inline styles on the new component shells.
 * These tests pin the new structure so a regression to inline styles
 * would fail CI.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Manual DOM + localStorage shims — this repo has no jsdom devDep.
const _lsStore = new Map();
globalThis.localStorage = {
  getItem: (k) => (_lsStore.has(k) ? _lsStore.get(k) : null),
  setItem: (k, v) => _lsStore.set(k, String(v)),
  removeItem: (k) => _lsStore.delete(k),
  clear: () => _lsStore.clear(),
};
globalThis.window = globalThis;
globalThis.document = {
  getElementById: () => null,
  querySelector: () => null,
  addEventListener: () => {},
  createElement: () => ({ style: {}, classList: { add(){}, remove(){} } }),
};

const G = (await import('../src/core/globals.js')).default;
const { renderQuiz } = await import('../src/ui/quiz-view.js');

function seedG() {
  G.QZ = [
    {
      q: 'A 62-year-old presents with new dyspnoea. Best next step?',
      o: ['Echo', 'Chest X-ray', 'BNP', 'Troponin'],
      c: 0,
      ti: 1,
      t: '2024-Sep',
      e: 'TTE confirms LV function and valves.',
    },
  ];
  G.pool = [0];
  G.qi = 0;
  G.sel = null;
  G.ans = false;
  G.examMode = false;
  G.sdMode = false;
  G.onCallMode = false;
  G.pomoActive = false;
  G.timedMode = false;
  G.blindRecall = false;
  G.autopsyMode = false;
  G.autopsyDistractor = -1;
  G.filt = 'all';
  G.years = [];
  G.topicFilt = -1;
  G.teachBackState = null;
  G._wrongReason = null;
  G._diffRating = null;
  G._exCache = G._exCache || {};
  G.S = G.S || {};
  G.S.qOk = 0;
  G.S.qNo = 0;
  G.S.bk = G.S.bk || {};
  G.S.qnotes = G.S.qnotes || {};
  G.S.sr = G.S.sr || {};
  G.S.flagged = G.S.flagged || {};
  G.S.dailyContract = { date: new Date().toISOString().slice(0, 10), dismissed: true };
  G.DIS = G.DIS || {};
  G.NOTES_BY_TI = G.NOTES_BY_TI || {};
  G.render = vi.fn();
  G.save = vi.fn();
}

beforeEach(() => seedG());
afterEach(() => {
  G.QZ = [];
  G.pool = [];
});

describe('renderQuiz — new structural shell (v1.15.0)', () => {
  it('renders the .quiz-stage section wrapper', () => {
    const html = renderQuiz();
    expect(html).toContain('class="quiz-stage"');
    expect(html).toContain('aria-label="שאלה"');
  });

  it('renders the question stem inside h2.quiz-question with dir="auto"', () => {
    const html = renderQuiz();
    expect(html).toMatch(/<h2[^>]*class="quiz-question"[^>]*dir="auto"/);
    expect(html).toContain('A 62-year-old presents with new dyspnoea');
  });

  it('renders an ol.quiz-choices with role="radiogroup"', () => {
    const html = renderQuiz();
    expect(html).toMatch(/<ol[^>]*class="quiz-choices"[^>]*role="radiogroup"/);
  });

  it('renders one button.quiz-choice per option, each with role=radio + data-action="pick"', () => {
    const html = renderQuiz();
    const matches = html.match(/<button[^>]*class="quiz-choice"/g) || [];
    expect(matches.length).toBe(4);
    expect(html).toMatch(/data-action="pick"\s+data-i="0"/);
    expect(html).toMatch(/data-action="pick"\s+data-i="3"/);
    expect((html.match(/role="radio"/g) || []).length).toBe(4);
    expect((html.match(/aria-checked="false"/g) || []).length).toBe(4);
  });

  it('renders a .quiz-choice__letter chip with mono-formatted A/B/C/D', () => {
    const html = renderQuiz();
    expect((html.match(/class="quiz-choice__letter"/g) || []).length).toBe(4);
    expect(html).toMatch(/>A</);
    expect(html).toMatch(/>D</);
  });
});

describe('renderQuiz — pre-answer footer', () => {
  it('shows a primary "Check" button (disabled until selection) and a ghost "give-up"', () => {
    const html = renderQuiz();
    expect(html).toMatch(/<button[^>]*class="btn btn--primary[^"]*"[^>]*data-action="check-answer"[^>]*disabled/);
    expect(html).toMatch(/data-action="give-up"/);
  });

  it('does NOT render the post-answer feedback panel', () => {
    const html = renderQuiz();
    expect(html).not.toContain('quiz-feedback');
  });
});

describe('renderQuiz — post-answer (correct)', () => {
  beforeEach(() => {
    G.sel = 0; // matches q.c
    G.ans = true;
  });

  it('renders .quiz-feedback.quiz-feedback--ok with role="status"', () => {
    const html = renderQuiz();
    expect(html).toContain('class="quiz-feedback quiz-feedback--ok"');
    expect(html).toContain('role="status"');
    expect(html).toContain('class="quiz-feedback__title"');
  });

  it('marks the chosen+correct choice with data-state="correct"', () => {
    const html = renderQuiz();
    expect(html).toMatch(/data-state="correct"[^<]*data-action="pick"\s+data-i="0"|data-action="pick"\s+data-i="0"[^>]*data-state="correct"/);
  });

  it('renders the next-q action in the footer', () => {
    const html = renderQuiz();
    expect(html).toMatch(/<button[^>]*class="btn btn--primary[^"]*"[^>]*data-action="next-q"/);
  });

  it('renders prev-q in non-exam mode', () => {
    const html = renderQuiz();
    expect(html).toMatch(/data-action="prev-q"/);
  });
});

describe('renderQuiz — post-answer (wrong)', () => {
  beforeEach(() => {
    G.sel = 2; // wrong (correct is 0)
    G.ans = true;
  });

  it('renders .quiz-feedback--err panel', () => {
    const html = renderQuiz();
    expect(html).toContain('quiz-feedback--err');
  });

  it('marks the picked-wrong choice with data-state="wrong"', () => {
    const html = renderQuiz();
    expect(html).toMatch(/data-action="pick"\s+data-i="2"[^>]*data-state="wrong"|data-state="wrong"[^>]*data-action="pick"\s+data-i="2"/);
  });

  it('marks the correct (un-chosen) choice with data-state="correct-unchosen"', () => {
    const html = renderQuiz();
    expect(html).toContain('data-state="correct-unchosen"');
  });

  it('shows the "Why did you get it wrong?" chips when no _wrongReason yet', () => {
    const html = renderQuiz();
    expect(html).toContain('class="quiz-wrong-reason"');
    expect(html).toMatch(/data-action="wrong-reason"\s+data-r="no_knowledge"/);
  });
});

describe('renderQuiz — invariants', () => {
  it('preserves canonical data-action names — pre-answer (pick / check-answer / give-up)', () => {
    G.sel = null; G.ans = false;
    const html = renderQuiz();
    for (const name of ['pick', 'check-answer', 'give-up', 'speak-q', 'share-q', 'toggle-bk', 'toggle-qnote']) {
      expect(html, `pre-answer markup is missing data-action="${name}"`).toContain(`data-action="${name}"`);
    }
  });

  it('preserves canonical data-action names — post-answer (next-q / prev-q / ai-explain)', () => {
    G.sel = 0; G.ans = true;
    const html = renderQuiz();
    for (const name of ['next-q', 'prev-q', 'ai-explain', 'speak-q', 'share-q']) {
      expect(html, `post-answer markup is missing data-action="${name}"`).toContain(`data-action="${name}"`);
    }
  });

  it('emits ZERO inline style attributes on the rebuilt component shells', () => {
    G.sel = 0; G.ans = true;
    const html = renderQuiz();
    const stageStart = html.indexOf('<section class="quiz-stage"');
    const stageEnd = html.lastIndexOf('</section>');
    expect(stageStart).toBeGreaterThanOrEqual(0);
    expect(stageEnd).toBeGreaterThan(stageStart);
    const stage = html.slice(stageStart, stageEnd);

    const inlineStyledClasses = [
      'quiz-stage', 'quiz-question', 'quiz-choices', 'quiz-choice',
      'quiz-feedback', 'quiz-actions', 'quiz-meta', 'quiz-tools', 'quiz-tool',
      'quiz-source', 'quiz-stats', 'quiz-distractor', 'quiz-aux',
    ];
    for (const cls of inlineStyledClasses) {
      const re = new RegExp(`<[a-z]+[^>]*class="[^"]*\\b${cls}\\b[^"]*"[^>]*style="`, 'i');
      expect(stage.match(re), `${cls} should not carry style="..." but does`).toBeNull();
    }
  });

  it('maps Hebrew/RTL safely via dir="auto" on the question and choices', () => {
    const html = renderQuiz();
    expect(html).toContain('<h2 class="quiz-question" dir="auto"');
    expect((html.match(/class="quiz-choice__text"\s+dir="auto"/g) || []).length).toBe(4);
  });
});
