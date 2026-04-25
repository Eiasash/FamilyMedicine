/**
 * v1.6.1: Parser-bleed guard for FamilyMedicine (Mishpacha Mega).
 *
 * History: the same IMA Hebrew RTL PDF parser used by the Geriatrics (Shlav A)
 * and InternalMedicine (Pnimit) siblings also feeds Mishpacha's question bank.
 *   - Geriatrics v10.34 (commit ca12e96): 318 contaminated past-exam options
 *     across 7 tags going back to 2022.
 *   - Pnimit v9.81 (commit 79a9ff9): 1 over-length option, no bleed pattern hits.
 *
 * v1.6.1 audit on the Mishpacha bank: dramatically clean — even cleaner than
 * Pnimit. Discovery scan (scripts/v1_6_0_bleed_scan.py) found:
 *   - 0 next-Q-stem bleed-pattern hits (after pos 30)
 *   - 0 footer-cruft hits (date + exam-header tail)
 *   - 1 over-length option (>250 chars): bank[550] in 2023-Jun, a legitimate
 *     4-patient-comparison Q (home-hospitalization criteria, 2020 IL position
 *     paper). All four options are detailed clinical vignettes by design
 *     (lengths 176/256/200/176) — NOT a parser bleed. Whitelisted below in
 *     LEGIT_LONG_OPTION_INDICES.
 *
 * No surgical fix needed. This guard locks in the clean state. If a future
 * ingestion regresses (new exam parsed with the same broken pipeline), the
 * test fails and forces a fix before merge.
 */
import { describe, test, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');
function loadJSON(rel) { return JSON.parse(readFileSync(resolve(ROOT, rel), 'utf-8')); }

// FM past-exam tags. Note: 'FM-Core' is NOT a past exam — it's curated
// content authored via the toranot proxy generator and is intentionally
// excluded from this audit.
const PAST_EXAM_TAGS = new Set([
  '2020', '2021-Jun', '2022-Jun', '2023-Jun',
  '2024-May', '2024-Sep', '2025-Jun',
]);

// Legitimately long options: stable bank indices for 4-patient comparison Qs
// or other intentional multi-line answer texts.
//   - 550: 2023-Jun, ti=26 (community medicine / aging in place). Asks which
//     of 4 patients best fits home-hospitalization criteria per the 2020 IL
//     position paper. All four options are full clinical vignettes (lengths
//     176, 256, 200, 176) by design.
const LEGIT_LONG_OPTION_INDICES = new Set([550]);

// Q-stem-start phrases — the universal IMA Hebrew Q openings.
// If one of these appears in an option after position 30, it's a bleed.
const Q_STEM_KW = String.raw`(?:מטופל|מטופלת|בן\s*\d|בת\s*\d|בנו|בתו|איזה\s|איזו\s|מה\s|מהי\s|מהן\s|מהם\s|אילו\s|מבין\s|מי\s+מהבאים|כל\s+הבאים|לפי\s+המאמר|על\s+פי\s+המאמר|בשאלות\s+הבאות)`;
const BLEED_RE = new RegExp(String.raw`\s\d{1,3}(?:\s+\d{1,3}){0,2}\s*["'\u0060?]?\s*[.:]?\s+(?=${Q_STEM_KW})`);

// Page-footer cruft — date + exam header. The IMA exam template uses
// "שלב א'" or "שלב א ברפואת המשפחה" as the header tail.
const FOOTER_RE = /\d{1,2}[/.]\d{1,2}[/.](?:20)?\d{2}.*שלב/;

describe('parser-bleed guard (v1.6.1) — past-exam option hygiene', () => {
  let questions;
  beforeAll(() => { questions = loadJSON('data/questions.json'); });

  test('no past-exam option contains a next-Q-stem bleed pattern after position 30', () => {
    const violations = [];
    questions.forEach((q, i) => {
      if (!PAST_EXAM_TAGS.has(q.t)) return;
      if (LEGIT_LONG_OPTION_INDICES.has(i)) return;
      (q.o || []).forEach((opt, j) => {
        if (typeof opt !== 'string') return;
        const m = BLEED_RE.exec(opt);
        if (m && m.index > 30) {
          violations.push({
            tag: q.t, idx: i, oidx: j,
            optLen: opt.length,
            bleedAt: m.index,
            preview: opt.slice(Math.max(0, m.index - 20), m.index + 60),
          });
        }
      });
    });
    if (violations.length) {
      console.error(`Bleed-pattern violations (${violations.length}):`,
                    violations.slice(0, 5));
    }
    expect(violations.length, `parser-bleed in ${violations.length} options`).toBe(0);
  });

  test('no past-exam option contains page-footer cruft (date + exam header)', () => {
    const violations = [];
    questions.forEach((q, i) => {
      if (!PAST_EXAM_TAGS.has(q.t)) return;
      if (LEGIT_LONG_OPTION_INDICES.has(i)) return;
      (q.o || []).forEach((opt, j) => {
        if (typeof opt !== 'string') return;
        if (FOOTER_RE.test(opt)) {
          violations.push({
            tag: q.t, idx: i, oidx: j,
            preview: opt.slice(0, 100),
          });
        }
      });
    });
    if (violations.length) {
      console.error(`Footer-cruft violations (${violations.length}):`, violations.slice(0, 5));
    }
    expect(violations.length, `footer-cruft in ${violations.length} options`).toBe(0);
  });

  test('no past-exam option exceeds 250 chars (legit long-option Qs whitelisted)', () => {
    // Generous cap. Real IMA options top out around 130 chars. 250 is
    // comfortably above any legit answer, well below any bleed wad.
    const violations = [];
    questions.forEach((q, i) => {
      if (!PAST_EXAM_TAGS.has(q.t)) return;
      if (LEGIT_LONG_OPTION_INDICES.has(i)) return;
      (q.o || []).forEach((opt, j) => {
        if (typeof opt === 'string' && opt.length > 250) {
          violations.push({
            tag: q.t, idx: i, oidx: j, len: opt.length, preview: opt.slice(0, 80),
          });
        }
      });
    });
    if (violations.length) {
      console.error(`Over-length (>250) options:`, violations.slice(0, 5));
    }
    expect(violations.length, `${violations.length} options exceed 250 char cap`).toBe(0);
  });
});
