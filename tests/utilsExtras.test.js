/**
 * Tests for the remaining under-covered helpers in src/core/utils.js:
 *   getApiKey / setApiKey — localStorage accessor pair.
 *   remapExplanationLetters — the Hebrew "תשובה א" rewrite branch.
 *   toast                  — graceful failure when document is unavailable.
 *
 * getOptShuffle / isMetaOption / sanitize / heDir / fmtT / isOk / safeJSONParse
 * are already covered in sibling test files.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getApiKey,
  setApiKey,
  remapExplanationLetters,
  toast,
} from '../src/core/utils.js';

function installLocalStorageShim() {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}

beforeEach(() => {
  installLocalStorageShim();
});

// ---- API key I/O -----------------------------------------------------------

describe('getApiKey + setApiKey', () => {
  it('returns empty string when no key is set', () => {
    expect(getApiKey()).toBe('');
  });

  it('persists a trimmed key via setApiKey', () => {
    setApiKey('  sk-test-abc  ');
    expect(localStorage.getItem('mishpacha_apikey')).toBe('sk-test-abc');
    expect(getApiKey()).toBe('sk-test-abc');
  });

  it('falsy value (empty string) removes the stored key', () => {
    setApiKey('sk-abc');
    expect(getApiKey()).toBe('sk-abc');
    setApiKey('');
    expect(getApiKey()).toBe('');
    expect(localStorage.getItem('mishpacha_apikey')).toBeNull();
  });

  it('null argument also clears the stored key', () => {
    setApiKey('sk-abc');
    setApiKey(null);
    expect(localStorage.getItem('mishpacha_apikey')).toBeNull();
  });
});

// ---- Hebrew letter remap ---------------------------------------------------

describe('remapExplanationLetters — Hebrew branch', () => {
  // The regex `(תשובה\s*)([א-ה])\b` only fires when the Hebrew letter
  // is immediately followed by an ASCII word character — `\b` is ASCII-only,
  // so it doesn't match between two Hebrew letters or between a Hebrew
  // letter and a space. Tests below reflect that actual behaviour.

  it('rewrites תשובה-prefixed Hebrew letters when followed by ASCII letters', () => {
    // shuf = [1, 2, 0, 3] → inv = { 1→0, 2→1, 0→2, 3→3 }
    // Original position 0 (Hebrew א) should get display index 2 → Hebrew ג.
    const shuf = [1, 2, 0, 3];
    expect(remapExplanationLetters('תשובה אcorrect', shuf))
      .toBe('תשובה גcorrect');
  });

  it('returns the original match when the Hebrew letter is outside א-ה', () => {
    // ו has no entry in the heb array, so the callback returns `m`.
    const shuf = [0, 1, 2, 3];
    // Followed by digit so \b triggers, but `heb.indexOf('ו') === -1`.
    expect(remapExplanationLetters('תשובה ו1', shuf))
      .toBe('תשובה ו1');
  });

  it('returns the original match when the display index is undefined', () => {
    // ה is at index 4 in the heb array; shuf shorter than 5 gives
    // inv[4] === undefined, so the callback falls back to `m`.
    const shuf = [0, 1, 2, 3];
    expect(remapExplanationLetters('תשובה הx', shuf))
      .toBe('תשובה הx');
  });

  it('rewrites Hebrew letter followed by whitespace (v1.21.8 fix)', () => {
    // Was a "known limitation" of the old ASCII-only \b regex. v1.21.8
    // switched to lookahead `(?=[^א-ת]|$)` which correctly handles
    // whitespace, geresh, ASCII letters, punct, and EOL after the letter.
    const shuf = [1, 2, 0, 3];
    expect(remapExplanationLetters('תשובה א נכונה', shuf))
      .toBe('תשובה ג נכונה');
  });

  it('leaves a Hebrew letter alone when not preceded by "תשובה"', () => {
    const shuf = [2, 0, 1, 3];
    expect(remapExplanationLetters('המילה אtest', shuf))
      .toBe('המילה אtest');
  });
});

// ---- toast -----------------------------------------------------------------

describe('toast', () => {
  it('does not throw when document is unavailable', () => {
    const saved = globalThis.document;
    delete globalThis.document;
    expect(() => toast('hello')).not.toThrow();
    globalThis.document = saved;
  });

  it('does not throw with unknown type (colors falls back to info)', () => {
    // Minimal DOM shim
    globalThis.document = {
      body: { appendChild: () => {} },
      createElement: () => ({
        setAttribute: () => {}, style: { cssText: '' },
        textContent: '', remove: () => {},
      }),
    };
    expect(() => toast('hello', 'nonsense-type', 10)).not.toThrow();
  });
});
