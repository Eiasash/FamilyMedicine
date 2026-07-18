/**
 * FM-5 (2026-07-15): the post-answer explanation (q.e) is escaped before it is
 * injected into innerHTML.
 *
 * q.e is attacker-controllable for custom questions (mishpacha_custom_qs /
 * pending). renderQuiz used to remap + .replace(\n->br, **bold**) and inject
 * q.e RAW — a stored-XSS sink. The fix sanitizes q.e FIRST, then applies the
 * <br>/<b> formatting (mirror of explain.js formatAutopsy).
 *
 * Manual DOM/localStorage shims mirror quizViewMarkup.test.js.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

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
  createElement: () => ({ style: {}, classList: { add() {}, remove() {} } }),
};

const G = (await import('../src/core/globals.js')).default;
const { renderQuiz } = await import('../src/ui/quiz-view.js');

const PAYLOAD = 'Danger <script>alert(document.cookie)</script>\n**Bold** & "quoted"';

function seedG() {
  G.QZ = [{
    q: 'Stem?',
    o: ['Echo', 'CXR', 'BNP', 'Troponin'],
    c: 0,
    ti: 1,
    t: '2024-Sep',
    e: PAYLOAD,
  }];
  G.pool = [0]; G.qi = 0;
  G.sel = 0; G.ans = true;          // post-answer (correct pick)
  G._reveal = false;
  G.examMode = false; G.timedMode = false; G.blindRecall = false;
  G.autopsyMode = false; G.autopsyDistractor = -1;
  G.filt = 'all'; G.years = []; G.topicFilt = -1;
  G.teachBackState = null; G._wrongReason = null; G._diffRating = null;
  G._exCache = {};
  G.S = G.S || {};
  G.S.qOk = 5; G.S.qNo = 1;
  G.S.bk = {}; G.S.qnotes = {}; G.S.sr = {}; G.S.flagged = {};
  G.S.dailyContract = { date: new Date().toISOString().slice(0, 10), dismissed: true };
  G.DIS = {}; G.NOTES_BY_TI = {};
  G.render = vi.fn(); G.save = vi.fn();
}

beforeEach(() => seedG());
afterEach(() => { G.QZ = []; G.pool = []; });

describe('FM-5: q.e explanation is sanitized before innerHTML', () => {
  it('neutralises a <script> payload in q.e (escaped, not injected raw)', () => {
    const html = renderQuiz();
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/<\/script/i);
  });

  it('escapes quotes and ampersands without double-escaping', () => {
    const html = renderQuiz();
    expect(html).toContain('&amp;');
    expect(html).toContain('&quot;');
    expect(html).not.toContain('&amp;amp;');
  });

  it('still applies the intended <br> / <b> formatting on the escaped text', () => {
    const html = renderQuiz();
    expect(html).toContain('<br>');
    expect(html).toContain('<b>Bold</b>');
  });
});
