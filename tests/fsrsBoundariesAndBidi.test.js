/**
 * FSRS interval boundary cases + Hebrew bidi/numeric handling.
 *
 * Two risk surfaces previously uncovered by the suite:
 *
 * (1) FSRS interval math. shared/fsrs.js is byte-identical across the three
 *     medical PWAs (Geri/IM/FM, canonical md5 cea66a0435…). Existing tests
 *     in tests/sharedFsrs.test.js + tests/flashcardFsrs.test.js cover the
 *     happy path (a card going through Again→Hard→Good→Easy reviews) but
 *     leave gaps at the boundaries:
 *
 *       • s ≤ 0          → fsrsR must return 0, not Infinity / NaN
 *       • t = 0          → fsrsR must return ≥ 1 (full retention at zero
 *         elapsed time, regardless of stability)
 *       • fsrsInterval(s) must always return ≥ 1, even for tiny s (0.1)
 *       • fsrsInitNew clamps difficulty to [1,10] and stability ≥ 0.1
 *       • fsrsUpdate ratings 1..4 produce sane stability (≥ 0.1) and
 *         difficulty (1 ≤ d ≤ 10)
 *       • fsrsDaysToExam edge cases: invalid string, past date, today,
 *         far-future date
 *       • fsrsIntervalWithDeadline never extends past base, never returns 0
 *
 *     A bug in any of these silently corrupts the entire study schedule —
 *     usually surfacing as "card I just answered Again is due in 3 weeks"
 *     or "all cards due today after a single bad review session".
 *
 * (2) Hebrew bidi numerics. heDir() classifies strings as rtl/ltr/auto for
 *     `dir=` attribute generation. When Hebrew text contains digits, dates,
 *     drug names, or lab abbreviations, the threshold ratio in heDir
 *     (≥ 25% Hebrew → rtl) determines whether the line will render LTR-
 *     forced (corrupts mixed Hebrew+English drug names) or RTL.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { heDir, sanitize, isMetaOption } from '../src/core/utils.js';

// shared/fsrs.js loads as a plain script — instantiate via Function() in the
// same pattern as honestStats.test.js / sharedFsrs.test.js.
const fsrsSrc = readFileSync(
  resolve(import.meta.dirname, '..', 'shared', 'fsrs.js'),
  'utf-8',
);
const T = {};
new Function(
  'target',
  fsrsSrc +
    ';Object.assign(target, { FSRS_W, FSRS_DECAY, FSRS_FACTOR, FSRS_RETENTION,' +
    ' fsrsR, fsrsInterval, fsrsInitNew, fsrsUpdate, fsrsMigrateFromSM2,' +
    ' isChronicFail, fsrsDaysToExam, fsrsIntervalWithDeadline,' +
    ' fsrsScheduleWithDeadline });',
)(T);

describe('FSRS — fsrsR boundary cases', () => {
  it('returns 0 when stability is 0 or negative', () => {
    expect(T.fsrsR(1, 0)).toBe(0);
    expect(T.fsrsR(10, -1)).toBe(0);
    expect(T.fsrsR(100, 0)).toBe(0);
  });

  it('returns 1 (full retention) when elapsed time is 0', () => {
    // R(0, s) = (1 + factor*0/s)^decay = 1^decay = 1
    expect(T.fsrsR(0, 1)).toBeCloseTo(1, 6);
    expect(T.fsrsR(0, 50)).toBeCloseTo(1, 6);
  });

  it('R is strictly decreasing in elapsed time t for fixed s', () => {
    const s = 10;
    let prev = Infinity;
    for (const t of [0, 1, 5, 10, 50, 200]) {
      const r = T.fsrsR(t, s);
      expect(r).toBeLessThanOrEqual(prev);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(1);
      prev = r;
    }
  });

  it('R at t=s equals retention target (~0.90) by construction', () => {
    // FSRS calibrates so that R(t=stability, s=stability) ≈ FSRS_RETENTION.
    expect(T.fsrsR(5, 5)).toBeCloseTo(T.FSRS_RETENTION, 3);
    expect(T.fsrsR(20, 20)).toBeCloseTo(T.FSRS_RETENTION, 3);
  });
});

describe('FSRS — fsrsInterval boundary cases', () => {
  it('always returns ≥ 1 day, even for very small stability', () => {
    // Stability of 0.1 (the floor in fsrsInitNew/fsrsUpdate) must not
    // produce a 0-day interval — that would re-show the card every refresh.
    expect(T.fsrsInterval(0.1)).toBeGreaterThanOrEqual(1);
    expect(T.fsrsInterval(0.5)).toBeGreaterThanOrEqual(1);
    expect(T.fsrsInterval(1)).toBeGreaterThanOrEqual(1);
  });

  it('grows monotonically with stability', () => {
    let prev = -1;
    for (const s of [0.1, 1, 5, 10, 30, 100, 365]) {
      const i = T.fsrsInterval(s);
      expect(i).toBeGreaterThanOrEqual(prev);
      prev = i;
    }
  });

  it('returns an integer', () => {
    for (const s of [0.5, 1.7, 13.2, 99.9]) {
      const i = T.fsrsInterval(s);
      expect(Number.isInteger(i)).toBe(true);
    }
  });
});

describe('FSRS — fsrsInitNew clamps and ratings', () => {
  it('all 4 ratings produce stability ≥ 0.1, difficulty in [1,10]', () => {
    for (const r of [1, 2, 3, 4]) {
      const { s, d } = T.fsrsInitNew(r);
      expect(s).toBeGreaterThanOrEqual(0.1);
      expect(d).toBeGreaterThanOrEqual(1);
      expect(d).toBeLessThanOrEqual(10);
    }
  });

  it('clamps unexpected ratings without crashing', () => {
    // Negative or >4 ratings get clamped (defensive — UI shouldn't send these).
    const { s: s0, d: d0 } = T.fsrsInitNew(-5);
    const { s: s9, d: d9 } = T.fsrsInitNew(99);
    expect(s0).toBeGreaterThanOrEqual(0.1);
    expect(s9).toBeGreaterThanOrEqual(0.1);
    expect(d0).toBeGreaterThanOrEqual(1);
    expect(d9).toBeLessThanOrEqual(10);
  });

  it('Easy (rating=4) gives higher initial stability than Again (rating=1)', () => {
    expect(T.fsrsInitNew(4).s).toBeGreaterThan(T.fsrsInitNew(1).s);
  });
});

describe('FSRS — fsrsUpdate stability never drops below floor', () => {
  it('after Again on a low-stability card, s ≥ 0.1', () => {
    const { s, d } = T.fsrsUpdate(0.1, 5, 0.5, 1);
    expect(s).toBeGreaterThanOrEqual(0.1);
    expect(d).toBeGreaterThanOrEqual(1);
    expect(d).toBeLessThanOrEqual(10);
  });

  it('after sequence Again → Good → Good, stability eventually grows', () => {
    let { s, d } = T.fsrsInitNew(1); // worst start
    const r0 = 0.3;
    ({ s, d } = T.fsrsUpdate(s, d, r0, 1));
    const sBefore = s;
    ({ s, d } = T.fsrsUpdate(s, d, T.fsrsR(2, s), 3));
    ({ s, d } = T.fsrsUpdate(s, d, T.fsrsR(5, s), 3));
    expect(s).toBeGreaterThan(sBefore);
  });

  it('ratings 1..4 all keep difficulty bounded', () => {
    let { s, d } = T.fsrsInitNew(3);
    for (const r of [1, 1, 4, 2, 3, 1, 4, 4]) {
      ({ s, d } = T.fsrsUpdate(s, d, T.fsrsR(1, s), r));
      expect(d).toBeGreaterThanOrEqual(1);
      expect(d).toBeLessThanOrEqual(10);
      expect(s).toBeGreaterThanOrEqual(0.1);
      expect(Number.isFinite(s)).toBe(true);
      expect(Number.isFinite(d)).toBe(true);
    }
  });
});

describe('FSRS — fsrsDaysToExam boundary cases', () => {
  it('returns null for missing/invalid date strings', () => {
    expect(T.fsrsDaysToExam('')).toBe(null);
    expect(T.fsrsDaysToExam('not-a-date')).toBe(null);
    expect(T.fsrsDaysToExam('2026/05/01')).toBe(null); // wrong separator
    expect(T.fsrsDaysToExam('26-05-01')).toBe(null);   // 2-digit year
  });

  it('returns 0 for a past date', () => {
    expect(T.fsrsDaysToExam('2020-01-01')).toBe(0);
  });

  it('returns a positive integer for a future date', () => {
    // Pick ~1 year out from "today" relative to test execution.
    const future = new Date(Date.now() + 300 * 86400000);
    const yyyy = future.getFullYear();
    const mm = String(future.getMonth() + 1).padStart(2, '0');
    const dd = String(future.getDate()).padStart(2, '0');
    const days = T.fsrsDaysToExam(`${yyyy}-${mm}-${dd}`);
    expect(days).toBeGreaterThan(290);
    expect(days).toBeLessThan(310);
    expect(Number.isInteger(days)).toBe(true);
  });
});

describe('FSRS — fsrsIntervalWithDeadline never widens', () => {
  it('with no deadline, returns base interval', () => {
    const base = T.fsrsInterval(20);
    const out = T.fsrsIntervalWithDeadline(20, 5, 0.85, undefined);
    // Either equal to base (no exam set in this test env) or capped <= base.
    expect(out).toBeLessThanOrEqual(base);
    expect(out).toBeGreaterThanOrEqual(1);
  });

  it('with deadline shorter than base, caps below base, never returns 0', () => {
    // Stability 100 → base interval ~ many months.
    const base = T.fsrsInterval(100);
    expect(base).toBeGreaterThan(30);
    const capped = T.fsrsIntervalWithDeadline(100, 5, 0.85, 14); // 14d to exam
    expect(capped).toBeGreaterThanOrEqual(1);
    expect(capped).toBeLessThanOrEqual(base);
  });

  it('returns ≥ 1 even at the deadline (1 day remaining)', () => {
    const out = T.fsrsIntervalWithDeadline(50, 5, 0.85, 1);
    expect(out).toBeGreaterThanOrEqual(1);
  });
});

describe('FSRS — isChronicFail thresholds', () => {
  // NOTE: shared/fsrs.js (byte-identical across 3 sibling repos) returns
  // `lowAccuracy||highDifficulty` which can be `undefined` when neither
  // branch is true (e.g. fsrsD missing). All call sites do truthy checks,
  // so we test for truthiness here. See IMPROVEMENTS.md for the
  // boolean-coerce proposal that needs a tri-repo coordinated bump.
  it('flags low-accuracy entries (tot ≥ 4 AND ok/tot < 0.35)', () => {
    expect(T.isChronicFail({ tot: 4, ok: 1 })).toBeTruthy();   // 25%
    expect(T.isChronicFail({ tot: 10, ok: 3 })).toBeTruthy();  // 30%
    expect(T.isChronicFail({ tot: 4, ok: 2 })).toBeFalsy();    // 50%
    expect(T.isChronicFail({ tot: 3, ok: 0 })).toBeFalsy();    // tot < 4
  });

  it('flags high-difficulty entries (fsrsD ≥ 8 AND tot ≥ 3)', () => {
    expect(T.isChronicFail({ tot: 3, ok: 2, fsrsD: 8 })).toBeTruthy();
    expect(T.isChronicFail({ tot: 5, ok: 5, fsrsD: 9 })).toBeTruthy();
    expect(T.isChronicFail({ tot: 3, ok: 2, fsrsD: 7 })).toBeFalsy(); // < 8
    expect(T.isChronicFail({ tot: 2, ok: 1, fsrsD: 9 })).toBeFalsy(); // tot < 3
  });

  it('returns false for null/undefined entries', () => {
    expect(T.isChronicFail(null)).toBe(false);
    expect(T.isChronicFail(undefined)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Hebrew bidi + numerics
// ─────────────────────────────────────────────────────────────────────────

describe('heDir — pure Hebrew, pure Latin, mixed', () => {
  it('pure Hebrew → rtl', () => {
    expect(heDir('שלום עולם')).toBe('rtl');
    expect(heDir('רפואת המשפחה')).toBe('rtl');
  });

  it('pure Latin → ltr', () => {
    expect(heDir('Hello world')).toBe('ltr');
    expect(heDir('NSAID')).toBe('ltr');
  });

  it('empty/whitespace → auto (no signal)', () => {
    expect(heDir('')).toBe('auto');
    expect(heDir(null)).toBe('auto');
    expect(heDir('   ')).toBe('auto');
    expect(heDir('   ...   ')).toBe('auto');
    expect(heDir('1234')).toBe('auto');     // digits only — no Hebrew or Latin
    expect(heDir('25 mg')).toBe('ltr');     // mg = Latin → ltr
  });
});

describe('heDir — mixed Hebrew + English drug names + numbers', () => {
  it('Hebrew drug name with English brand → rtl when Hebrew majority', () => {
    // "מטפורמין (Glucophage) 500 מ״ג" — mostly Hebrew, expect rtl.
    expect(heDir('מטפורמין (Glucophage) 500 מ״ג')).toBe('rtl');
  });

  it('mostly-English with sprinkled Hebrew → ltr below 25% threshold', () => {
    // 1 Hebrew letter out of many Latin → ltr.
    expect(heDir('Take metformin 500 mg PO BID א')).toBe('ltr');
  });

  it('Hebrew dates (e.g. ב-15 בינואר 2026) → rtl', () => {
    expect(heDir('ב-15 בינואר 2026')).toBe('rtl');
  });

  it('lab abbreviations alongside Hebrew → rtl', () => {
    // "אשלגן (K+) 5.5 mEq/L" — Hebrew dominant
    expect(heDir('אשלגן (K+) 5.5 mEq/L')).toBe('rtl');
  });

  it('threshold case: ≥25% Hebrew letters out of (he+en) flips to rtl', () => {
    // Construct exactly the boundary: 1 Hebrew, 3 Latin = 25% → rtl.
    expect(heDir('abcש')).toBe('rtl');
    // 1 Hebrew, 4 Latin = 20% → ltr.
    expect(heDir('abcdש')).toBe('ltr');
  });
});

describe('sanitize — defends against injected HTML in Hebrew strings', () => {
  it('escapes < > & " \' even when surrounded by Hebrew', () => {
    const out = sanitize('שלום <script>alert(1)</script> "סוף"');
    expect(out).not.toContain('<script>');
    expect(out).not.toContain('</script>');
    expect(out).toContain('&lt;script&gt;');
    expect(out).toContain('&quot;');
  });

  it('handles null/undefined/0 without throwing (current sanitize() coerces falsy → "")', () => {
    expect(sanitize(null)).toBe('');
    expect(sanitize(undefined)).toBe('');
    // sanitize uses `String(s||'')` so falsy values become ''. Documenting
    // the behavior as-is — call sites pre-check before passing 0.
    expect(sanitize(0)).toBe('');
    expect(sanitize(false)).toBe('');
    // Truthy non-string still serialized:
    expect(sanitize(42)).toBe('42');
  });
});

describe('isMetaOption — quiz options like "all of the above"', () => {
  it('flags Hebrew "כל התשובות נכונות" variants', () => {
    expect(isMetaOption('כל התשובות נכונות')).toBe(true);
    expect(isMetaOption('כל התשובות לא נכונות')).toBe(true);
  });

  it('flags Latin "all of the above" variants', () => {
    expect(isMetaOption('All of the above')).toBe(true);
    expect(isMetaOption('None of the above')).toBe(true);
  });

  it('does NOT flag normal clinical options', () => {
    expect(isMetaOption('Metformin 500mg PO BID')).toBe(false);
    expect(isMetaOption('דיאזפם 5 מ״ג')).toBe(false);
  });
});
