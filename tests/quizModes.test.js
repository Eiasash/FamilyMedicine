/**
 * Tests for the under-covered helpers in src/quiz/modes.js:
 *   startPomodoro / stopPomodoro / renderPomoOverlay
 *   startNextBestStep (NBS filter)
 *   speakQuestion (speech synthesis wrapper)
 *   startVoiceParser (voice-to-text fallback)
 *   requestWakeLock (no-op on non-supporting envs)
 *
 * suddenDeath is already covered by tests/suddenDeath.test.js.
 *
 * modes.js only depends on G and { fmtT, toast } — no FSRS bridge needed.
 * document + localStorage are shimmed manually (no jsdom in devDeps).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import G from '../src/core/globals.js';
import {
  startPomodoro,
  stopPomodoro,
  renderPomoOverlay,
  startNextBestStep,
  speakQuestion,
  startVoiceParser,
  requestWakeLock,
} from '../src/quiz/modes.js';

function installLocalStorageShim() {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}

// Minimal DOM shim: getElementById returns whatever is in _els, createElement
// makes a fake element that records its appendChild target.
function installDomShim() {
  const byId = new Map();
  const body = {
    children: [],
    appendChild(el) { this.children.push(el); el._parent = this; return el; },
  };
  function makeEl(tag = 'div') {
    const el = {
      tagName: tag.toUpperCase(),
      id: '',
      className: '',
      style: {},
      textContent: '',
      innerHTML: '',
      _parent: null,
      appendChild(child) { child._parent = this; return child; },
      remove() {
        if (this._parent && Array.isArray(this._parent.children)) {
          const idx = this._parent.children.indexOf(this);
          if (idx >= 0) this._parent.children.splice(idx, 1);
        }
        if (this.id) byId.delete(this.id);
      },
      set _id(v) { this.id = v; if (v) byId.set(v, this); },
    };
    // Make assignment to .id also register in byId so getElementById works
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
    _body: body,
    body,
    getElementById: (id) => byId.get(id) || null,
    createElement: (tag) => makeEl(tag),
  };
  return { byId, body };
}

beforeEach(() => {
  installLocalStorageShim();
  installDomShim();
  G.QZ = [
    { q: 'הצעד הבא בטיפול?', o: ['a', 'b', 'c', 'd'], c: 0, ti: 0 },
    { q: 'mechanism of action', o: ['a', 'b', 'c', 'd'], c: 1, ti: 1 },
    { q: 'הגישה הנכונה לחולה', o: ['x', 'y', 'z', 'w'], c: 2, ti: 2 },
    { q: 'first-line therapy', o: ['p', 'q', 'r', 's'], c: 3, ti: 0 },
    { q: 'הטיפול המתאים ביותר', o: ['1', '2', '3', '4'], c: 0, ti: 1 },
    { q: 'plain chronic management', o: ['1', '2', '3', '4'], c: 0, ti: 2 },
  ];
  G.pool = [];
  G.qi = 0;
  G.sel = null;
  G.ans = false;
  G.render = vi.fn();
  G.pomoInterval = null;
  G.pomoActive = false;
  G.pomoSec = 0;
  G.pomoBreak = false;
  G.pomoBreakSec = 0;
  G.isSpeaking = false;
  G.voiceListening = false;
  G.voiceTranscript = '';
  G.srchQ = '';
  G.tab = 'quiz';
  G.filt = 'all';
});

afterEach(() => {
  // Make sure we never leak a running interval between tests.
  if (G.pomoInterval) clearInterval(G.pomoInterval);
  G.pomoInterval = null;
  G.pomoActive = false;
  vi.useRealTimers();
});

// ---- Pomodoro --------------------------------------------------------------

describe('startPomodoro', () => {
  it('initialises timer state and schedules an interval', () => {
    startPomodoro();
    expect(G.pomoActive).toBe(true);
    expect(G.pomoSec).toBe(3000);
    expect(G.pomoBreak).toBe(false);
    expect(G.pomoBreakSec).toBe(300);
    expect(G.pomoInterval).not.toBeNull();
    expect(G.render).toHaveBeenCalledTimes(1);
  });

  it('clears a previous interval so we never leak two', () => {
    startPomodoro();
    const firstId = G.pomoInterval;
    startPomodoro();
    const secondId = G.pomoInterval;
    // setInterval returns a new id each call; the old one is cleared
    expect(secondId).not.toBe(firstId);
  });

  it('each tick decrements pomoSec while not on break', () => {
    vi.useFakeTimers();
    startPomodoro();
    vi.advanceTimersByTime(3000); // 3 ticks
    expect(G.pomoSec).toBe(3000 - 3);
    expect(G.pomoBreak).toBe(false);
  });

  it('flips into break mode when pomoSec reaches zero', () => {
    vi.useFakeTimers();
    startPomodoro();
    G.pomoSec = 1; // one tick away from the break flip
    vi.advanceTimersByTime(1000);
    expect(G.pomoBreak).toBe(true);
    expect(G.pomoBreakSec).toBe(300);
  });

  it('break mode decrements pomoBreakSec and flips back to work', () => {
    vi.useFakeTimers();
    startPomodoro();
    G.pomoBreak = true;
    G.pomoBreakSec = 2;
    vi.advanceTimersByTime(2000);
    // Two ticks consume both break seconds and flip back.
    expect(G.pomoBreak).toBe(false);
    expect(G.pomoSec).toBe(3000);
  });
});

describe('stopPomodoro', () => {
  it('unsets pomoActive, clears interval, and removes any overlay', () => {
    startPomodoro();
    // Simulate an overlay present in the DOM.
    const fake = document.createElement('div');
    fake.id = 'pomo-overlay';
    document.body.appendChild(fake);
    stopPomodoro();
    expect(G.pomoActive).toBe(false);
    expect(G.pomoInterval).toBeNull();
    expect(document.getElementById('pomo-overlay')).toBeNull();
  });

  it('is safe to call when no interval is running', () => {
    G.pomoInterval = null;
    expect(() => stopPomodoro()).not.toThrow();
    expect(G.pomoActive).toBe(false);
  });
});

describe('renderPomoOverlay', () => {
  it('no-ops when pomoBreak is false', () => {
    G.pomoBreak = false;
    renderPomoOverlay();
    expect(document.getElementById('pomo-overlay')).toBeNull();
  });

  it('creates an overlay div when pomoBreak is true', () => {
    G.pomoBreak = true;
    G.pomoBreakSec = 180;
    renderPomoOverlay();
    const ov = document.getElementById('pomo-overlay');
    expect(ov).not.toBeNull();
    expect(ov.innerHTML).toContain('Break Time');
  });

  it('does not create a second overlay if one already exists', () => {
    G.pomoBreak = true;
    renderPomoOverlay();
    const ov1 = document.getElementById('pomo-overlay');
    renderPomoOverlay();
    const ov2 = document.getElementById('pomo-overlay');
    expect(ov2).toBe(ov1);
  });
});

// ---- Next Best Step filter -------------------------------------------------

describe('startNextBestStep', () => {
  it('populates pool with only NBS-pattern questions', () => {
    startNextBestStep();
    // Indices 0, 2, 3, 4 match one of the Hebrew/English NBS patterns.
    const sorted = G.pool.slice().sort((a, b) => a - b);
    expect(sorted).toEqual([0, 2, 3, 4]);
  });

  it('sets filt to "nbs"', () => {
    startNextBestStep();
    expect(G.filt).toBe('nbs');
  });

  it('resets qi/sel/ans and calls render', () => {
    G.qi = 5;
    G.sel = 2;
    G.ans = true;
    startNextBestStep();
    expect(G.qi).toBe(0);
    expect(G.sel).toBeNull();
    expect(G.ans).toBe(false);
    expect(G.render).toHaveBeenCalled();
  });

  it('initialises session tracking fields', () => {
    startNextBestStep();
    expect(G._sessionOk).toBe(0);
    expect(G._sessionNo).toBe(0);
    expect(G._sessionBest).toEqual({});
    expect(G._sessionWorse).toEqual({});
    expect(typeof G._sessionStart).toBe('number');
    expect(G._sessionSaved).toBe(false);
  });

  it('produces an empty pool when no question matches', () => {
    G.QZ = [{ q: 'something else', o: ['a'], c: 0 }];
    startNextBestStep();
    expect(G.pool).toEqual([]);
  });
});

// ---- speakQuestion ---------------------------------------------------------

describe('speakQuestion', () => {
  it('no-ops when window.speechSynthesis is undefined', () => {
    // Ensure the flag is not flipped.
    delete globalThis.speechSynthesis;
    globalThis.window = { /* no speechSynthesis */ };
    G.pool = [0];
    G.qi = 0;
    G.isSpeaking = false;
    speakQuestion();
    expect(G.isSpeaking).toBe(false);
  });

  it('cancels and resets flag when already speaking', () => {
    const cancel = vi.fn();
    globalThis.window = { speechSynthesis: { speak: vi.fn(), cancel } };
    globalThis.SpeechSynthesisUtterance = class {
      constructor(t) { this.text = t; }
    };
    G.isSpeaking = true;
    speakQuestion();
    expect(cancel).toHaveBeenCalled();
    expect(G.isSpeaking).toBe(false);
    expect(G.render).toHaveBeenCalled();
  });

  it('calls speechSynthesis.speak with an utterance containing question text', () => {
    const speak = vi.fn();
    globalThis.window = { speechSynthesis: { speak, cancel: vi.fn() } };
    let capturedText = null;
    globalThis.SpeechSynthesisUtterance = class {
      constructor(t) {
        this.text = t; capturedText = t;
        this.onend = null; this.onerror = null;
      }
    };
    G.pool = [0];
    G.qi = 0;
    G.isSpeaking = false;
    speakQuestion();
    expect(speak).toHaveBeenCalledTimes(1);
    expect(capturedText).toContain(G.QZ[0].q);
    expect(G.isSpeaking).toBe(true);
  });
});

// ---- startVoiceParser ------------------------------------------------------

describe('startVoiceParser', () => {
  it('falls back with toast when no SpeechRecognition is available', () => {
    globalThis.window = { /* neither flavour */ };
    G.voiceListening = false;
    // Should not throw; toast() is wrapped in try/catch internally
    startVoiceParser();
    expect(G.voiceListening).toBe(false);
  });

  it('starts recognition and wires onresult to update voiceTranscript + search tab', () => {
    const startSpy = vi.fn();
    let onresult;
    class FakeSR {
      constructor() {
        this.lang = null; this.interimResults = true; this.maxAlternatives = 0;
      }
      start() { startSpy(); }
      set onresult(fn) { onresult = fn; }
      set onerror(_) {}
      set onend(_) {}
    }
    globalThis.window = { SpeechRecognition: FakeSR };
    globalThis.SpeechRecognition = FakeSR;

    startVoiceParser();
    expect(G.voiceListening).toBe(true);
    expect(startSpy).toHaveBeenCalled();

    // Simulate a recognition result coming back.
    onresult({ results: [[{ transcript: 'diabetes type two hypertension' }]] });
    expect(G.voiceListening).toBe(false);
    expect(G.srchQ).toBe('diabetes type two hypertension');
    expect(G.tab).toBe('search');
  });
});

// ---- requestWakeLock -------------------------------------------------------

describe('requestWakeLock', () => {
  it('resolves without throwing regardless of the host environment', async () => {
    // Real navigator on Node has no wakeLock and is read-only. The function
    // is wrapped in try/catch and uses a `'G.wakeLock' in navigator` check
    // that is always false in the current source, so the body short-circuits.
    await expect(requestWakeLock()).resolves.toBeUndefined();
  });
});
