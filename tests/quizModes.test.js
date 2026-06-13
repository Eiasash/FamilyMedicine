import { describe, it, expect, beforeEach, vi } from 'vitest';
import G from '../src/core/globals.js';
import {
  startNextBestStep,
  speakQuestion,
  startVoiceParser,
  requestWakeLock,
} from '../src/quiz/modes.js';

function installDomShim() {
  globalThis.document = {
    getElementById: () => null,
    createElement: () => ({ style: {}, remove() {} }),
    body: { appendChild() {} },
  };
}

beforeEach(() => {
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
  G.isSpeaking = false;
  G.voiceListening = false;
  G.voiceTranscript = '';
  G.srchQ = '';
  G.tab = 'quiz';
  G.filt = 'all';
});

describe('startNextBestStep', () => {
  it('populates pool with only NBS-pattern questions', () => {
    startNextBestStep();
    const sorted = G.pool.slice().sort((a, b) => a - b);
    expect(sorted).toEqual([0, 2, 3, 4]);
  });

  it('sets filt to nbs and resets question state', () => {
    G.qi = 5;
    G.sel = 2;
    G.ans = true;
    startNextBestStep();
    expect(G.filt).toBe('nbs');
    expect(G.qi).toBe(0);
    expect(G.sel).toBeNull();
    expect(G.ans).toBe(false);
    expect(G.render).toHaveBeenCalled();
  });
});

describe('speakQuestion', () => {
  it('starts speech synthesis for the current question', () => {
    const speak = vi.fn();
    globalThis.window = {
      speechSynthesis: { speak, cancel: vi.fn() },
      SpeechSynthesisUtterance: class {
        constructor(text) { this.text = text; }
      },
    };
    globalThis.SpeechSynthesisUtterance = globalThis.window.SpeechSynthesisUtterance;
    G.pool = [0];
    speakQuestion();
    expect(speak).toHaveBeenCalledTimes(1);
    expect(G.isSpeaking).toBe(true);
  });
});

describe('startVoiceParser', () => {
  it('toasts when speech recognition is unavailable', () => {
    globalThis.window = {};
    expect(() => startVoiceParser()).not.toThrow();
  });
});

describe('requestWakeLock', () => {
  it('is safe when wakeLock is unsupported', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: {},
      configurable: true,
    });
    await expect(requestWakeLock()).resolves.toBeUndefined();
  });
});
