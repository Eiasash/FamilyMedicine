/**
 * Regression guards — ratchet tests pinned to the exact bugs we've already shipped:
 *   - Hebrew mojibake (ð where נ should be; CP1255→Latin-1 extraction bug)
 *   - Latin-1 extended chars adjacent to Hebrew (encoding drift)
 *   - Hebrew+digit with no space ("בן58" should be "בן 58")
 *   - Wrong-side question-mark ("?heb..." from RTL mishandling)
 *   - Adjacent-question fragment bleed into stem
 *   - Duplicate questions per-tag + cross-tag (normalized-stem match)
 *   - c-vs-explanation mismatch (Sonnet drifted; explanation defends
 *     a different letter than the official key — confuses students)
 *   - Unreasonable stem/option lengths
 *
 * CI fails before a corrupted release ships. Every guard here tracks a bug
 * that actually happened in ingest history; do not relax thresholds without
 * documenting the regression.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

const rootDir = resolve(import.meta.dirname, '..');

function loadJSON(relPath) {
  return JSON.parse(readFileSync(resolve(rootDir, relPath), 'utf-8'));
}

const PAST_EXAM_TAGS = new Set([
  '2020', '2021-Jun', '2022-Jun', '2023-Jun',
  '2024-May', '2024-Sep', '2025-Jun', '2026-Jun',
]);

// ─────────────────────────────────────────────────────────────
// Encoding integrity
// ─────────────────────────────────────────────────────────────
describe('questions.json — encoding integrity', () => {
  let questions;
  beforeAll(() => { questions = loadJSON('data/questions.json'); });

  // ð (U+00F0) = Hebrew נ (CP1255 0xF0) misread as Latin-1.
  // This bug corrupted 191 Qs across 2024-May + 2024-Sep before v1.2.8.
  test('no question contains the ð mojibake character', () => {
    const violations = [];
    questions.forEach((q, i) => {
      const all = [q.q || '', ...(q.o || []), q.e || ''].join('|');
      if (all.includes('ð')) {
        violations.push({ i, tag: q.t, preview: (q.q || '').slice(0, 60) });
      }
    });
    if (violations.length) {
      console.error(`ð-mojibake found in ${violations.length} Qs:`, violations.slice(0, 3));
    }
    expect(violations.length).toBe(0);
  });

  // Any Latin-1 extended char adjacent to Hebrew is almost always encoding drift.
  // Whitelist: legitimate diacritics in medical proper nouns (Guillain-Barré, São Paulo).
  test('no Latin-1 extended chars adjacent to Hebrew letters (non-whitelisted)', () => {
    const LEGIT = 'éèêëàâäîïôöûüñçÉÈÊÀÂÜÑÇøåÅ';
    const badAdjacent = /[\u0590-\u05FF][\u00C0-\u00FF]|[\u00C0-\u00FF][\u0590-\u05FF]/g;
    const violations = [];
    questions.forEach((q, i) => {
      const text = [q.q || '', ...(q.o || [])].join(' | ');
      const matches = [...text.matchAll(badAdjacent)];
      for (const m of matches) {
        const ch = m[0].split('').find(c => c.charCodeAt(0) >= 0xC0 && c.charCodeAt(0) <= 0xFF);
        if (ch && !LEGIT.includes(ch)) {
          violations.push({ i, tag: q.t, char: ch });
          break;
        }
      }
    });
    if (violations.length) {
      console.error(`Latin-1 adjacency in ${violations.length} Qs:`, violations.slice(0, 3));
    }
    expect(violations.length).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────
// Formatting quality — past-exam corpus is locked clean
// ─────────────────────────────────────────────────────────────
describe('questions.json — formatting quality', () => {
  let questions;
  beforeAll(() => { questions = loadJSON('data/questions.json'); });

  // Catches "בן58" → should be "בן 58". Budget is a ratchet — current baseline
  // is ~510 (from raw PDF extraction artifacts). Bug must NOT make this worse.
  // Lower this threshold when the corpus is progressively cleaned.
  test('Hebrew-digit missing-space count stays ≤ 515', () => {
    const bad = [];
    questions.forEach((q, i) => {
      if (!PAST_EXAM_TAGS.has(q.t)) return;
      const text = [q.q || '', ...(q.o || [])].join(' | ');
      if (/[\u0590-\u05FF]\d/.test(text)) {
        bad.push({ i, tag: q.t });
      }
    });
    if (bad.length > 515) console.error('Hebrew+digit missing space:', bad.slice(0, 3));
    expect(bad.length).toBeLessThanOrEqual(515);
  });

  // Catches ?heb (question-mark on wrong side from RTL mangling).
  // Ratchet — current baseline ~359. Lower over time.
  test('wrong-side ?[Hebrew] count stays ≤ 365', () => {
    const bad = [];
    questions.forEach((q, i) => {
      if (!PAST_EXAM_TAGS.has(q.t)) return;
      const text = [q.q || '', ...(q.o || [])].join(' | ');
      if (/\?[\u0590-\u05FF]/.test(text)) {
        bad.push({ i, tag: q.t });
      }
    });
    if (bad.length > 365) console.error('Wrong-side ?heb:', bad.slice(0, 3));
    expect(bad.length).toBeLessThanOrEqual(365);
  });

  // Adjacent-Q fragment bleed: next-Q's opener glued onto this stem.
  // Excludes legitimate figure/grade/stage references.
  test('no adjacent-question fragment glued into stem', () => {
    const bad = [];
    const STARTERS = /^(בן|בת|גבר|אישה|איש|מטופל|חולה|מה|איזה|איזו|באיזו|באיזה|האם)/;
    const REF_PREFIXES = /(תמונה|דרגה|שלב|class|stage|grade|טבלה|גרף|שאלה|CIN|CKD|NYHA|GCS|TNM|pT|pN|pM|אחיו|אחותו|אחי|אחות|בנו|בתו|הילד|הילדה|אבא|אמא|בעלה|בעל|אשתו|חבר|חברו|שכן)\s*$/i;
    questions.forEach((q, i) => {
      if (!PAST_EXAM_TAGS.has(q.t) || !q.q) return;
      const re = /(\S*)\s([1-9])\.\s([\u0590-\u05FF]+)/g;
      let m;
      while ((m = re.exec(q.q)) !== null) {
        const prevWord = m[1], nextWord = m[3];
        if (STARTERS.test(nextWord) && !REF_PREFIXES.test(prevWord)) {
          const before = q.q.slice(Math.max(0, m.index - 30), m.index);
          if (REF_PREFIXES.test(before.split(/\s+/).slice(-2).join(' '))) continue;
          bad.push({ i, tag: q.t, match: m[0] });
          break;
        }
      }
    });
    if (bad.length) console.error('Fragment-bleed:', bad.slice(0, 3));
    expect(bad.length).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────
// Duplicate detection
// ─────────────────────────────────────────────────────────────
describe('questions.json — duplicates', () => {
  let questions;
  beforeAll(() => { questions = loadJSON('data/questions.json'); });

  const normStem = (s) => (s || '').replace(/[\s\d.,?!:;()[\]"'\-\u05BE]+/g, '').toLowerCase();

  test('no duplicate questions within a single tag (normalized stem)', () => {
    const byTagKey = new Map();
    const dupes = [];
    questions.forEach((q, i) => {
      const ns = normStem(q.q);
      if (!ns || ns.length < 20) return;
      const key = `${q.t}||${ns}`;
      if (byTagKey.has(key)) {
        dupes.push({ first: byTagKey.get(key), second: i, tag: q.t });
      } else {
        byTagKey.set(key, i);
      }
    });
    if (dupes.length) console.error('Within-tag near-duplicates:', dupes.slice(0, 5));
    expect(dupes.length).toBe(0);
  });

  // Cross-tag duplicates: IMA board exams legitimately recycle ~0-10 questions between sessions.
  // Documented recycled Qs in v1.3.0 corpus:
  //   Q14 (2020)=Q162 (2021-Jun): mild acne treatment
  //   Q217 (2021-Jun)≈Q742 (2024-Sep): Israeli abortion law
  //   Q482 (2023-Jun)=Q748 (2024-Sep): retinal detachment
  //   Q340 (2022-Jun)=Q788 (2024-Sep): diabetic retinopathy course
  //   Q541 (2023-Jun)=Q792 (2024-Sep): BRCA screening position paper
  // Budget allows up to 20 cross-tag dupes before the guard trips (catches mass duplication
  // from a bad ingest, without flagging genuine IMA reuse).
  test('no duplicate questions across all tags (normalized stem)', () => {
    const seen = new Map();
    const dupes = [];
    questions.forEach((q, i) => {
      const key = normStem(q.q);
      if (!key || key.length < 20) return;
      if (seen.has(key)) {
        dupes.push({ first: seen.get(key), second: i, tags: [questions[seen.get(key)].t, q.t] });
      } else {
        seen.set(key, i);
      }
    });
    if (dupes.length > 5) console.error('Cross-tag near-duplicates:', dupes.slice(0, 10));
    expect(dupes.length).toBeLessThanOrEqual(20);
  });
});

// ─────────────────────────────────────────────────────────────
// c vs. explanation consistency
// ─────────────────────────────────────────────────────────────
describe('questions.json — c-vs-explanation consistency', () => {
  let questions;
  beforeAll(() => { questions = loadJSON('data/questions.json'); });

  // Every Hebrew explanation that names the correct answer must name the
  // OFFICIAL c (or a letter in c_accept). v1.2.7 fixed 114 Qs where
  // Sonnet drifted; any new mismatch is a regression.
  test('explanation never defends a letter other than c (or c_accept)', () => {
    const HEB = { 'א': 0, 'ב': 1, 'ג': 2, 'ד': 3 };
    const patterns = [
      /התשובה הנכונה היא\s*[״'""\-:]?\s*([\u05d0-\u05d3])/,
      /התשובה היא\s*[״'""\-:]?\s*([\u05d0-\u05d3])/,
    ];
    const mismatches = [];
    questions.forEach((q, i) => {
      const e = q.e || '';
      let claimed = null;
      for (const p of patterns) {
        const m = e.match(p);
        if (m) { claimed = HEB[m[1]]; break; }
      }
      if (claimed === null) return;
      const accept = q.c_accept || [q.c];
      if (claimed !== q.c && !accept.includes(claimed)) {
        mismatches.push({ i, tag: q.t, c: q.c, claimed, c_accept: q.c_accept });
      }
    });
    if (mismatches.length) console.error('c-vs-e mismatches:', mismatches.slice(0, 5));
    expect(mismatches.length).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────
// Length reasonableness
// ─────────────────────────────────────────────────────────────
describe('questions.json — length invariants', () => {
  let questions;
  beforeAll(() => { questions = loadJSON('data/questions.json'); });

  test('every stem length in [15, 3000]', () => {
    const bad = [];
    questions.forEach((q, i) => {
      const len = (q.q || '').length;
      if (len < 15 || len > 3000) bad.push({ i, tag: q.t, len });
    });
    if (bad.length) console.error('Stem length violations:', bad.slice(0, 5));
    expect(bad.length).toBe(0);
  });

  test('every option length in [1, 800]', () => {
    const bad = [];
    questions.forEach((q, i) => {
      (q.o || []).forEach((o, j) => {
        const len = (o || '').length;
        if (len < 1 || len > 800) bad.push({ i, tag: q.t, opt: j, len });
      });
    });
    if (bad.length) console.error('Option length violations:', bad.slice(0, 5));
    expect(bad.length).toBe(0);
  });
});
