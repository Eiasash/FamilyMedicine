/**
 * FM-9 (2026-07-18): the dead keyword auto-tagger was DELETED from
 * src/core/data-loader.js (not relocated).
 *
 * Why deleted rather than moved: the tagger expects G.TK (data/topics.json) to be an
 * array of keyword ARRAYS (it calls keys.forEach on each element), but topics.json is
 * an array of {id,en,he} topic-name objects (see textbookData.test.js). Relocating it
 * to run after the data loads would throw "keys.forEach is not a function", and there
 * is no keyword source to match against. Every shipped question already carries a
 * curated numeric ti, so topic tagging comes ONLY from the question banks. topics.json
 * is unused at runtime (topic names come from the TOPICS constant), so the loader no
 * longer fetches it.
 *
 * This test pins that decision.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const loaderSrc = readFileSync(resolve(root, 'src/core/data-loader.js'), 'utf8');
const questions = JSON.parse(readFileSync(resolve(root, 'data/questions.json'), 'utf8'));

describe('FM-9: dead keyword auto-tagger removed', () => {
  it('the loader no longer contains the keyword tagger', () => {
    expect(loaderSrc).not.toContain('best>=0?best:8'); // old default-to-8 assignment
    expect(loaderSrc).not.toContain('G.TK.forEach');    // old keyword scoring loop
  });

  it('the loader no longer fetches topics.json into G.TK', () => {
    expect(loaderSrc).not.toMatch(/TK:\s*['"]topics\.json['"]/); // gone from files map
    expect(loaderSrc).not.toMatch(/G\.TK\s*=/);                  // no assignment to G.TK
  });

  it('tagging comes only from questions.json — every question is self-tagged (ti 0..26)', () => {
    expect(Array.isArray(questions)).toBe(true);
    expect(questions.length).toBeGreaterThan(0);
    const bad = questions.filter((q) => !Number.isInteger(q.ti) || q.ti < 0 || q.ti > 26);
    expect(bad.length).toBe(0);
  });
});
