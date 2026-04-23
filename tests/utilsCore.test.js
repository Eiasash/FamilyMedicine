/**
 * Tests for uncovered utilities in src/core/utils.js:
 *   safeJSONParse, heDir, fmtT, isOk
 *
 * sanitize, isMetaOption, remapExplanationLetters, and getOptShuffle are
 * already covered by realSanitize.test.js and optShuffle.test.js.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { safeJSONParse, heDir, fmtT, isOk } from '../src/core/utils.js';

// localStorage shim (no jsdom installed)
function installLocalStorageShim() {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
  return store;
}

// ---- safeJSONParse ---------------------------------------------------------

describe('safeJSONParse', () => {
  beforeEach(() => {
    installLocalStorageShim();
  });

  it('returns parsed value when key holds valid JSON', () => {
    localStorage.setItem('key', JSON.stringify({ a: 1 }));
    expect(safeJSONParse('key', {})).toEqual({ a: 1 });
  });

  it('returns fallback when key is absent', () => {
    expect(safeJSONParse('missing', 42)).toBe(42);
  });

  it('returns fallback and removes key on corrupt JSON', () => {
    localStorage.setItem('bad', '{BROKEN');
    const result = safeJSONParse('bad', 'fallback');
    expect(result).toBe('fallback');
    // corrupt key should be removed
    expect(localStorage.getItem('bad')).toBeNull();
  });

  it('returns fallback when stored value is the string "null"', () => {
    localStorage.setItem('n', 'null');
    expect(safeJSONParse('n', 'fb')).toBe('fb');
  });

  it('handles falsy fallback values (0, false, empty string)', () => {
    expect(safeJSONParse('none', 0)).toBe(0);
    expect(safeJSONParse('none', false)).toBe(false);
    expect(safeJSONParse('none', '')).toBe('');
  });

  it('parses arrays correctly', () => {
    localStorage.setItem('arr', '[1,2,3]');
    expect(safeJSONParse('arr', [])).toEqual([1, 2, 3]);
  });
});

// ---- heDir -----------------------------------------------------------------

describe('heDir — text direction detection', () => {
  it('returns "rtl" for predominantly Hebrew text', () => {
    // A string of Hebrew characters
    expect(heDir('שלום עולם')).toBe('rtl');
  });

  it('returns "ltr" for predominantly English text', () => {
    expect(heDir('Hello world')).toBe('ltr');
  });

  it('returns "auto" for an empty string', () => {
    expect(heDir('')).toBe('auto');
  });

  it('returns "auto" for null / undefined (coerced via String())', () => {
    expect(heDir(null)).toBe('auto');
    expect(heDir(undefined)).toBe('auto');
  });

  it('returns "rtl" when Hebrew chars are ≥ 25% of letter count', () => {
    // 3 Hebrew, 9 English → 3/12 = 25% → exactly at threshold → rtl
    const s = 'abcdefghi' + 'אבג'; // 9 EN + 3 HE
    expect(heDir(s)).toBe('rtl');
  });

  it('returns "ltr" when Hebrew chars are below 25%', () => {
    // 1 Hebrew, 10 English → 1/11 ≈ 9% → ltr
    const s = 'abcdefghij' + 'א';
    expect(heDir(s)).toBe('ltr');
  });

  it('returns "auto" for a string with only digits/punctuation (no letters)', () => {
    expect(heDir('12345...')).toBe('auto');
  });
});

// ---- fmtT ------------------------------------------------------------------

describe('fmtT — seconds to H:MM:SS / MM:SS', () => {
  it('formats 0 seconds as "00:00"', () => {
    expect(fmtT(0)).toBe('00:00');
  });

  it('formats 59 seconds as "00:59"', () => {
    expect(fmtT(59)).toBe('00:59');
  });

  it('formats 60 seconds as "01:00"', () => {
    expect(fmtT(60)).toBe('01:00');
  });

  it('formats 90 seconds as "01:30"', () => {
    expect(fmtT(90)).toBe('01:30');
  });

  it('formats 3600 seconds as "1:00:00"', () => {
    expect(fmtT(3600)).toBe('1:00:00');
  });

  it('formats 3661 seconds as "1:01:01"', () => {
    expect(fmtT(3661)).toBe('1:01:01');
  });

  it('formats 3599 seconds as "59:59" (no hours prefix)', () => {
    expect(fmtT(3599)).toBe('59:59');
  });

  it('formats 7322 seconds as "2:02:02"', () => {
    expect(fmtT(7322)).toBe('2:02:02');
  });
});

// ---- isOk ------------------------------------------------------------------

describe('isOk — grading helper', () => {
  it('returns true when i === q.c (primary correct answer)', () => {
    expect(isOk({ c: 2, o: ['a', 'b', 'c', 'd'] }, 2)).toBe(true);
  });

  it('returns false when i !== q.c and no c_accept', () => {
    expect(isOk({ c: 2, o: ['a', 'b', 'c', 'd'] }, 1)).toBe(false);
  });

  it('returns true when i is in c_accept array', () => {
    const q = { c: 0, c_accept: [0, 2], o: ['a', 'b', 'c', 'd'] };
    expect(isOk(q, 0)).toBe(true);
    expect(isOk(q, 2)).toBe(true);
  });

  it('returns false when i is NOT in c_accept array', () => {
    const q = { c: 0, c_accept: [0, 2], o: ['a', 'b', 'c', 'd'] };
    expect(isOk(q, 1)).toBe(false);
    expect(isOk(q, 3)).toBe(false);
  });

  it('ignores q.c when c_accept is provided (c_accept is authoritative)', () => {
    // c=0 but c_accept=[1,2]: only 1 and 2 should be accepted
    const q = { c: 0, c_accept: [1, 2], o: ['a', 'b', 'c', 'd'] };
    expect(isOk(q, 0)).toBe(false);
    expect(isOk(q, 1)).toBe(true);
  });

  it('falls back to q.c when c_accept is an empty array', () => {
    const q = { c: 3, c_accept: [], o: ['a', 'b', 'c', 'd'] };
    expect(isOk(q, 3)).toBe(true);
    expect(isOk(q, 0)).toBe(false);
  });

  it('returns false for null question', () => {
    expect(isOk(null, 0)).toBe(false);
    expect(isOk(undefined, 0)).toBe(false);
  });
});
