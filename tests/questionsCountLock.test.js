import { readFileSync } from 'fs';
import { resolve } from 'path';

const rootDir = resolve(import.meta.dirname, '..');

// Lock test — pins per-session Q counts so re-ingestion drops / miscounts fail loudly.
// When intentionally growing the corpus, update EXPECTED_COUNTS in the same commit.

const EXPECTED_COUNTS = {
  '2020': 91,
  '2021-Jun': 149,
  '2022-Jun': 147,   // 146 from remote ingest + 1 manually recovered (Q77 AST:ALT hepatitis)
  '2023-Jun': 147,   // was 148, dropped Q133 (spirogram image, empty options unrecoverable)
  '2024-May': 100,   // 99 from remote ingest + 1 manually recovered (Q42 denosumab rebound)
  '2024-Sep': 100,   // 99 from remote ingest + 1 manually recovered (Q90 IPF PFT)
  '2025-Jun': 150,
};

const EXPECTED_TOTAL = Object.values(EXPECTED_COUNTS).reduce((a, b) => a + b, 0);

const ALLOWED_TAGS = new Set([
  '2020', '2021-Jun', '2022-Jun', '2023-Jun',
  '2024-May', '2024-Sep', '2025-Jun',
  'Goroll', 'Nelson', 'AFP', 'Exam',
]);

describe('data/questions.json — count + schema lock', () => {
  let questions;

  beforeAll(() => {
    const raw = readFileSync(resolve(rootDir, 'data/questions.json'), 'utf-8');
    questions = JSON.parse(raw);
  });

  test(`total count equals ${EXPECTED_TOTAL}`, () => {
    expect(questions).toHaveLength(EXPECTED_TOTAL);
  });

  test('per-tag counts match the lock', () => {
    const counts = {};
    for (const q of questions) counts[q.t] = (counts[q.t] || 0) + 1;
    for (const [tag, expected] of Object.entries(EXPECTED_COUNTS)) {
      expect(counts[tag], `tag=${tag}`).toBe(expected);
    }
  });

  test('every tag is in the whitelist', () => {
    const bad = [];
    for (const q of questions) if (!ALLOWED_TAGS.has(q.t)) bad.push(q.t);
    expect(bad, `unknown tags: ${[...new Set(bad)].join(', ')}`).toEqual([]);
  });

  test('every Q has all required schema fields', () => {
    const required = ['q', 'o', 'c', 'c_accept', 't', 'ti', 'e'];
    const errs = [];
    questions.forEach((q, i) => {
      for (const k of required) {
        if (!(k in q)) errs.push(`Q[${i}] (${q.t}) missing '${k}'`);
      }
    });
    expect(errs.slice(0, 5)).toEqual([]);
  });

  test('every Q has exactly 4 options', () => {
    const errs = [];
    questions.forEach((q, i) => {
      if (!Array.isArray(q.o) || q.o.length !== 4) {
        errs.push(`Q[${i}] options len=${q.o?.length}`);
      }
    });
    expect(errs.slice(0, 5)).toEqual([]);
  });

  test('c is int 0..3 and member of c_accept', () => {
    const errs = [];
    questions.forEach((q, i) => {
      if (!Number.isInteger(q.c) || q.c < 0 || q.c > 3) {
        errs.push(`Q[${i}] bad c=${q.c}`);
      } else if (!Array.isArray(q.c_accept) || !q.c_accept.includes(q.c)) {
        errs.push(`Q[${i}] c=${q.c} not in c_accept=${JSON.stringify(q.c_accept)}`);
      }
    });
    expect(errs.slice(0, 5)).toEqual([]);
  });

  test('ti is int 0..26', () => {
    const errs = [];
    questions.forEach((q, i) => {
      if (!Number.isInteger(q.ti) || q.ti < 0 || q.ti > 26) {
        errs.push(`Q[${i}] bad ti=${q.ti}`);
      }
    });
    expect(errs.slice(0, 5)).toEqual([]);
  });

  test('explanation is >= 20 chars', () => {
    const errs = [];
    questions.forEach((q, i) => {
      if (typeof q.e !== 'string' || q.e.length < 20) {
        errs.push(`Q[${i}] short e=${q.e?.length}`);
      }
    });
    expect(errs.slice(0, 5)).toEqual([]);
  });
});
