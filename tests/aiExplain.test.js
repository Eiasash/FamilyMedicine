/**
 * Tests for the under-covered AI flows in src/ai/explain.js:
 *   toggleFlagExplain — toggles a flag bit on G.S.flagged and re-renders.
 *   renderExplainBox  — writes loading / error / success HTML into a target.
 *   explainWithAI     — caches successful responses; surfaces errors as badges.
 *   gradeTeachBack    — parses rubric JSON; falls back to safe defaults.
 *   startVoiceTeachBack — graceful fallback when SpeechRecognition is missing.
 *
 * callAI is vi.mocked so we never touch the network.
 * Manual DOM + localStorage shims (no jsdom in devDeps).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../src/ai/client.js', () => ({
  callAI: vi.fn(),
}));

import G from '../src/core/globals.js';
import {
  toggleFlagExplain,
  renderExplainBox,
  explainWithAI,
  gradeTeachBack,
  startVoiceTeachBack,
} from '../src/ai/explain.js';
import { callAI } from '../src/ai/client.js';

function installLocalStorageShim() {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}

function installDomShim() {
  const byId = new Map();
  function makeEl(tag = 'div') {
    const el = {
      tagName: tag.toUpperCase(),
      className: '',
      style: {},
      textContent: '',
      innerHTML: '',
      disabled: false,
      value: '',
      _parent: null,
      _listeners: {},
      appendChild(child) { child._parent = this; return child; },
      addEventListener(evt, fn) { (this._listeners[evt] ||= []).push(fn); },
      remove() { if (this.__id) byId.delete(this.__id); },
    };
    Object.defineProperty(el, 'id', {
      get() { return el.__id || ''; },
      set(v) {
        if (el.__id) byId.delete(el.__id);
        el.__id = v;
        if (v) byId.set(v, el);
      },
    });
    return el;
  }
  globalThis.document = {
    _byId: byId,
    body: { appendChild: () => {} },
    getElementById: (id) => byId.get(id) || null,
    createElement: (tag) => makeEl(tag),
  };
  return { byId, makeEl };
}

beforeEach(() => {
  installLocalStorageShim();
  installDomShim();
  G.S = { flagged: {} };
  G.save = vi.fn();
  G.render = vi.fn();
  G._exCache = {};
  G._exLoading = false;
  G._exIdx = -1;
  G.teachBackState = null;
  G.QZ = [
    { q: 'What is the first-line for HTN?', o: ['ACEi', 'BB', 'CCB', 'Diuretic'], c: 0, ti: 0 },
    { q: 'מהו הטיפול המתאים?', o: ['a', 'b', 'c', 'd'], c: 1, ti: 1 },
  ];
  callAI.mockReset();
});

// ---- toggleFlagExplain -----------------------------------------------------

describe('toggleFlagExplain', () => {
  it('creates S.flagged if missing and marks the question', () => {
    G.S.flagged = undefined;
    toggleFlagExplain(0);
    expect(G.S.flagged[0]).toBe(true);
    expect(G.save).toHaveBeenCalledTimes(1);
  });

  it('toggles an existing flag off and deletes the key', () => {
    G.S.flagged = { 0: true };
    toggleFlagExplain(0);
    expect(G.S.flagged[0]).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(G.S.flagged, 0)).toBe(false);
  });

  it('re-renders the explain box when a target node exists', () => {
    G._exCache[0] = { text: 'ok' };
    const target = document.createElement('div');
    target.id = 'ai-explain-0';
    toggleFlagExplain(0);
    // innerHTML should have been written.
    expect(target.innerHTML).toContain('🤖');
  });
});

// ---- renderExplainBox ------------------------------------------------------

describe('renderExplainBox', () => {
  it('no-ops when no target container exists in the DOM', () => {
    expect(() => renderExplainBox(42)).not.toThrow();
  });

  it('renders a loading banner when _exLoading matches the target qIdx', () => {
    const t = document.createElement('div'); t.id = 'ai-explain-5';
    G._exLoading = true;
    G._exIdx = 5;
    renderExplainBox(5);
    expect(t.innerHTML).toContain('⏳');
  });

  it('does not render a loading banner for a different qIdx', () => {
    const t = document.createElement('div'); t.id = 'ai-explain-7';
    G._exLoading = true;
    G._exIdx = 3; // different
    renderExplainBox(7);
    expect(t.innerHTML).toBe('');
  });

  it('renders the cached text once present', () => {
    const t = document.createElement('div'); t.id = 'ai-explain-0';
    G._exCache[0] = { text: 'Explanation text here' };
    renderExplainBox(0);
    expect(t.innerHTML).toContain('Explanation text here');
    expect(t.innerHTML).toContain('🤖');
  });

  it('shows a red error banner when cache entry has err', () => {
    const t = document.createElement('div'); t.id = 'ai-explain-0';
    G._exCache[0] = { err: 'AI unavailable' };
    renderExplainBox(0);
    expect(t.innerHTML).toContain('⚠️');
    expect(t.innerHTML).toContain('AI unavailable');
  });

  it('sanitizes injected error messages (no raw HTML leaks)', () => {
    const t = document.createElement('div'); t.id = 'ai-explain-0';
    G._exCache[0] = { err: '<script>x</script>' };
    renderExplainBox(0);
    expect(t.innerHTML).not.toMatch(/<script/);
    expect(t.innerHTML).toContain('&lt;script&gt;');
  });
});

// ---- explainWithAI ---------------------------------------------------------

describe('explainWithAI', () => {
  it('caches a successful result and persists to localStorage', async () => {
    callAI.mockResolvedValueOnce('Because lisinopril is first-line.');
    await explainWithAI(0);
    expect(G._exCache[0]).toEqual({ text: 'Because lisinopril is first-line.' });
    const stored = JSON.parse(localStorage.getItem('mishpacha_ex'));
    expect(stored[0].text).toBe('Because lisinopril is first-line.');
    expect(callAI).toHaveBeenCalledTimes(1);
  });

  it('short-circuits when a cached entry is already present', async () => {
    G._exCache[0] = { text: 'already cached' };
    await explainWithAI(0);
    expect(callAI).not.toHaveBeenCalled();
  });

  it('ignores cache entry with .err and re-queries', async () => {
    G._exCache[0] = { err: 'prev fail' };
    callAI.mockResolvedValueOnce('fresh');
    await explainWithAI(0);
    expect(callAI).toHaveBeenCalledTimes(1);
    expect(G._exCache[0]).toEqual({ text: 'fresh' });
  });

  it('translates the "no_key" error into a friendly badge', async () => {
    callAI.mockRejectedValueOnce(new Error('no_key'));
    await explainWithAI(0);
    expect(G._exCache[0].err).toBe('AI unavailable — set API key in Track');
    expect(G._exLoading).toBe(false);
  });

  it('surfaces generic error messages verbatim on failure', async () => {
    callAI.mockRejectedValueOnce(new Error('API 500'));
    await explainWithAI(0);
    expect(G._exCache[0].err).toBe('API 500');
  });

  it('uses English instruction when the stem is ≥25% English letters', async () => {
    callAI.mockResolvedValueOnce('eng text');
    await explainWithAI(0); // English-heavy stem
    const prompt = callAI.mock.calls[0][0][0].content;
    expect(prompt).toContain('Explain in English');
  });

  it('uses Hebrew instruction when the stem is Hebrew-heavy', async () => {
    callAI.mockResolvedValueOnce('heb text');
    await explainWithAI(1); // Hebrew stem
    const prompt = callAI.mock.calls[0][0][0].content;
    expect(prompt).toContain('הסבר בעברית');
  });

  it('flips _exLoading on during the call and off after', async () => {
    let observedDuringCall = null;
    callAI.mockImplementation(async () => {
      observedDuringCall = { loading: G._exLoading, idx: G._exIdx };
      return 'ok';
    });
    await explainWithAI(0);
    expect(observedDuringCall).toEqual({ loading: true, idx: 0 });
    expect(G._exLoading).toBe(false);
    expect(G._exIdx).toBe(-1);
  });
});

// ---- gradeTeachBack --------------------------------------------------------

describe('gradeTeachBack', () => {
  it('parses rubric JSON into teachBackState with score + feedback', async () => {
    callAI.mockResolvedValueOnce(
      '{"score":3,"mechanism":1,"criteria":1,"exception":1,"feedback":"מצוין"}'
    );
    await gradeTeachBack(0, 'user explanation');
    expect(G.teachBackState).toEqual({ score: 3, feedback: 'מצוין' });
  });

  it('falls back to score=1 when the AI returns non-JSON', async () => {
    callAI.mockResolvedValueOnce('No JSON here, just prose.');
    await gradeTeachBack(0, 'explanation');
    expect(G.teachBackState.score).toBe(1);
    expect(G.teachBackState.feedback).toContain('לא התקבל משוב');
  });

  it('falls back to score=1 when score field is missing', async () => {
    callAI.mockResolvedValueOnce('{"feedback":"ok"}');
    await gradeTeachBack(0, 'explanation');
    expect(G.teachBackState.score).toBe(1);
    expect(G.teachBackState.feedback).toBe('ok');
  });

  it('surfaces no_key errors as "AI unavailable"', async () => {
    callAI.mockRejectedValueOnce(new Error('no_key'));
    await gradeTeachBack(0, 'explanation');
    expect(G.teachBackState.score).toBeNull();
    expect(G.teachBackState.feedback).toContain('AI unavailable');
  });

  it('surfaces generic errors with a warning emoji', async () => {
    callAI.mockRejectedValueOnce(new Error('rate limit'));
    await gradeTeachBack(0, 'explanation');
    expect(G.teachBackState.score).toBeNull();
    expect(G.teachBackState.feedback).toContain('rate limit');
  });

  it('sets teachBackState to "grading" before the callAI resolves', async () => {
    let stateDuringCall = null;
    callAI.mockImplementation(async () => {
      stateDuringCall = G.teachBackState;
      return '{"score":2,"feedback":"ok"}';
    });
    await gradeTeachBack(0, 'x');
    expect(stateDuringCall).toBe('grading');
  });
});

// ---- startVoiceTeachBack ---------------------------------------------------

describe('startVoiceTeachBack', () => {
  it('falls back with toast when SpeechRecognition is unavailable', () => {
    globalThis.window = {};
    delete globalThis.SpeechRecognition;
    delete globalThis.webkitSpeechRecognition;
    expect(() => startVoiceTeachBack()).not.toThrow();
  });

  it('bails early when the #tbInput element is missing', () => {
    const startSpy = vi.fn();
    class FakeSR { start() { startSpy(); } }
    globalThis.window = { SpeechRecognition: FakeSR };
    globalThis.SpeechRecognition = FakeSR;
    // no #tbInput → function should early-return via toast
    expect(() => startVoiceTeachBack()).not.toThrow();
    expect(startSpy).not.toHaveBeenCalled();
  });

  it('starts recognition when the input exists and wires handlers', () => {
    const input = document.createElement('textarea'); input.id = 'tbInput'; input.value = '';
    const btn = document.createElement('button'); btn.id = 'tb-mic-btn';
    let handlers = {};
    const startSpy = vi.fn();
    class FakeSR {
      constructor() { this.lang = null; this.continuous = true; this.interimResults = true; }
      start() { startSpy(); }
      set onresult(fn) { handlers.onresult = fn; }
      set onerror(fn) { handlers.onerror = fn; }
      set onend(fn) { handlers.onend = fn; }
    }
    globalThis.window = { SpeechRecognition: FakeSR };
    globalThis.SpeechRecognition = FakeSR;
    startVoiceTeachBack();
    expect(startSpy).toHaveBeenCalledTimes(1);
    expect(btn.textContent).toBe('🔴');
    expect(btn.disabled).toBe(true);
    handlers.onresult({ results: [[{ transcript: 'patient reports chest pain' }]] });
    expect(input.value).toContain('patient reports chest pain');
    expect(btn.textContent).toBe('🎙️');
    expect(btn.disabled).toBe(false);
  });
});
