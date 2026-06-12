/**
 * Schema validation for the family-medicine textbook readers / data files.
 *
 * Mishpacha Mega blends three textbooks (Goroll 8e, Harrison 22e, Nelson 22e)
 * plus an AFP article index, and exposes them through library-view + the
 * AI chapter tools. None of the chapter or table-of-contents JSON files
 * had direct test coverage — silent shape drift surfaces as a blank reader
 * pane on the user's phone with no console error to triage.
 *
 * This file pins:
 *   - harrison_chapters.json   { id → {title, sections[{title, content[]}], wordCount} }
 *   - goroll_chapters.json     { idx → {num, title, page, end_page} }   (239 chapter TOC)
 *   - lerner_chapters.json     { meta, topics, chapters }                (AFP index)
 *   - data/notes.json          27 entries with {ti, en, he, body}
 *   - data/drugs.json          {name, heb, cat, risk, preg, renal, peds}
 *   - data/topics.json         27 entries with {id, en, he}
 *   - data/tabs.json           4 navigation tabs
 *   - data/nelson_notes.json   pediatric notes keyed by chapter id
 *
 * Cross-references:
 *   - every notes[].ti must match a topics[].id
 *   - every questions[].ti must point at a defined topic
 */

import { describe, it, test, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');
const DATA = resolve(ROOT, 'data');

function load(file) {
  return JSON.parse(readFileSync(resolve(ROOT, file), 'utf-8'));
}
function loadData(file) {
  return JSON.parse(readFileSync(resolve(DATA, file), 'utf-8'));
}

describe('harrison_chapters.json — schema', () => {
  let harrison;
  beforeAll(() => {
    harrison = load('harrison_chapters.json');
  });

  it('parses as a non-array object', () => {
    expect(typeof harrison).toBe('object');
    expect(Array.isArray(harrison)).toBe(false);
  });

  it('has at least 30 chapters (Mishpacha syllabus subset)', () => {
    expect(Object.keys(harrison).length).toBeGreaterThanOrEqual(30);
  });

  it('every chapter has title (non-empty), sections (array), wordCount (number)', () => {
    const bad = [];
    for (const [k, ch] of Object.entries(harrison)) {
      if (typeof ch.title !== 'string' || ch.title.trim().length === 0) bad.push({ k, why: 'title' });
      if (!Array.isArray(ch.sections)) bad.push({ k, why: 'sections' });
      if (typeof ch.wordCount !== 'number') bad.push({ k, why: 'wordCount' });
    }
    expect(bad).toEqual([]);
  });

  it('every section has title (string) and content (array of strings)', () => {
    const bad = [];
    for (const [k, ch] of Object.entries(harrison)) {
      ch.sections.forEach((s, i) => {
        if (typeof s.title !== 'string') bad.push({ k, i });
        if (!Array.isArray(s.content)) bad.push({ k, i, why: 'content' });
      });
    }
    expect(bad.slice(0, 3)).toEqual([]);
  });

  it('no chapter has zero sections or zero wordCount', () => {
    const broken = Object.entries(harrison)
      .filter(([, ch]) => ch.sections.length === 0 || ch.wordCount === 0)
      .map(([k]) => k);
    expect(broken).toEqual([]);
  });
});

describe('goroll_chapters.json — TOC schema', () => {
  let goroll;
  beforeAll(() => {
    goroll = load('goroll_chapters.json');
  });

  it('is an array (or array-like object) with 200+ entries', () => {
    expect(typeof goroll).toBe('object');
    expect(Object.keys(goroll).length).toBeGreaterThan(200);
  });

  it('every entry has num (int), title (non-empty string), page (int), end_page (int)', () => {
    const bad = [];
    for (const [k, ch] of Object.entries(goroll)) {
      if (!Number.isInteger(ch.num)) bad.push({ k, why: 'num' });
      if (typeof ch.title !== 'string' || ch.title.trim().length === 0) bad.push({ k, why: 'title' });
      if (!Number.isInteger(ch.page)) bad.push({ k, why: 'page' });
      if (!Number.isInteger(ch.end_page)) bad.push({ k, why: 'end_page' });
    }
    expect(bad).toEqual([]);
  });

  it('end_page >= page for every chapter (no inverted ranges)', () => {
    const inverted = [];
    for (const [k, ch] of Object.entries(goroll)) {
      if (ch.end_page < ch.page) inverted.push({ k, num: ch.num, page: ch.page, end_page: ch.end_page });
    }
    expect(inverted).toEqual([]);
  });

  it('chapter numbers cover at least 1..200', () => {
    const nums = new Set(Object.values(goroll).map((ch) => ch.num));
    let missing = 0;
    for (let n = 1; n <= 200; n++) if (!nums.has(n)) missing++;
    expect(missing, `${missing} chapter numbers missing from 1..200`).toBe(0);
  });
});

describe('lerner_chapters.json — AFP article index', () => {
  let lerner;
  beforeAll(() => {
    lerner = load('lerner_chapters.json');
  });

  it('has the three top-level keys (meta, topics, chapters)', () => {
    expect(lerner).toHaveProperty('meta');
    expect(lerner).toHaveProperty('topics');
    expect(lerner).toHaveProperty('chapters');
  });

  it('chapters is a non-empty object', () => {
    expect(typeof lerner.chapters).toBe('object');
    expect(Object.keys(lerner.chapters).length).toBeGreaterThan(0);
  });
});

describe('data/notes.json — schema', () => {
  let notes, topics;
  beforeAll(() => {
    notes = loadData('notes.json');
    topics = loadData('topics.json');
  });

  it('is an array of 27 notes (one per topic)', () => {
    expect(Array.isArray(notes)).toBe(true);
    expect(notes.length).toBe(27);
  });

  it('every note has ti (int), en (string), he (string), body (string)', () => {
    notes.forEach((n, i) => {
      expect(Number.isInteger(n.ti), `notes[${i}].ti`).toBe(true);
      expect(typeof n.en, `notes[${i}].en`).toBe('string');
      expect(typeof n.he, `notes[${i}].he`).toBe('string');
      expect(typeof n.body, `notes[${i}].body`).toBe('string');
      expect(n.body.length, `notes[${i}].body non-empty`).toBeGreaterThan(0);
    });
  });

  it('every note.ti maps to a defined topics[].id', () => {
    const ids = new Set(topics.map((t) => t.id));
    const orphans = notes.filter((n) => !ids.has(n.ti));
    expect(orphans.map((n) => n.ti)).toEqual([]);
  });
});

describe('data/drugs.json — schema', () => {
  let drugs;
  beforeAll(() => {
    drugs = loadData('drugs.json');
  });

  it('is a non-empty array', () => {
    expect(Array.isArray(drugs)).toBe(true);
    expect(drugs.length).toBeGreaterThan(0);
  });

  it('every drug has name, heb, cat, risk (4 required fields)', () => {
    drugs.forEach((d, i) => {
      expect(typeof d.name, `drugs[${i}].name`).toBe('string');
      expect(d.name.trim().length).toBeGreaterThan(0);
      expect(typeof d.heb, `drugs[${i}].heb`).toBe('string');
      expect(typeof d.cat, `drugs[${i}].cat`).toBe('string');
      expect(typeof d.risk, `drugs[${i}].risk`).toBe('string');
    });
  });

  it('preg/renal/peds fields, when present, are strings', () => {
    drugs.forEach((d, i) => {
      if (d.preg !== undefined) expect(typeof d.preg, `drugs[${i}].preg`).toBe('string');
      if (d.renal !== undefined) expect(typeof d.renal, `drugs[${i}].renal`).toBe('string');
      if (d.peds !== undefined) expect(typeof d.peds, `drugs[${i}].peds`).toBe('string');
    });
  });

  it('no duplicate drug names (case-insensitive)', () => {
    const seen = new Map();
    const dups = [];
    for (const d of drugs) {
      const key = d.name.toLowerCase();
      if (seen.has(key)) dups.push(d.name);
      else seen.set(key, true);
    }
    expect(dups).toEqual([]);
  });

  it('risk descriptions are clinically meaningful (>= 10 chars)', () => {
    const sparse = drugs.filter((d) => d.risk.trim().length < 10);
    expect(sparse.map((d) => d.name)).toEqual([]);
  });
});

describe('data/topics.json — schema', () => {
  let topics;
  beforeAll(() => {
    topics = loadData('topics.json');
  });

  it('is an array of 27 topics', () => {
    expect(Array.isArray(topics)).toBe(true);
    expect(topics.length).toBe(27);
  });

  it('every topic has id (int), en (string), he (string)', () => {
    topics.forEach((t, i) => {
      expect(Number.isInteger(t.id), `topics[${i}].id`).toBe(true);
      expect(typeof t.en, `topics[${i}].en`).toBe('string');
      expect(typeof t.he, `topics[${i}].he`).toBe('string');
      expect(t.en.length, `topics[${i}].en non-empty`).toBeGreaterThan(0);
      expect(t.he.length, `topics[${i}].he non-empty`).toBeGreaterThan(0);
    });
  });

  it('topic ids are unique', () => {
    const ids = topics.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('data/tabs.json — navigation', () => {
  let tabs;
  beforeAll(() => {
    tabs = loadData('tabs.json');
  });

  it('is an array of exactly 4 tabs (Quiz / Study / Track / More)', () => {
    expect(Array.isArray(tabs)).toBe(true);
    expect(tabs.length).toBe(4);
    // Anchor the order so a future reorder lands as a deliberate test edit,
    // not a silent UX regression. v1.19.0 (mirror of Pnimit v10.0): Learn
    // tab merged into Library as a sub-tab (Read/Cards/Notes/Drugs); Settings
    // moved to a gear-icon overlay outside the bottom-nav.
    expect(tabs.map((t) => t.id)).toEqual(['quiz', 'lib', 'track', 'more']);
  });

  it('every tab has id (string), ic (string), l (string)', () => {
    tabs.forEach((t, i) => {
      expect(typeof t.id, `tabs[${i}].id`).toBe('string');
      expect(typeof t.ic, `tabs[${i}].ic`).toBe('string');
      expect(typeof t.l, `tabs[${i}].l`).toBe('string');
    });
  });

  it('tab ids are unique', () => {
    const ids = tabs.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('data/nelson_notes.json — pediatric notes', () => {
  let nelson;
  beforeAll(() => {
    nelson = loadData('nelson_notes.json');
  });

  it('is a non-empty object', () => {
    expect(typeof nelson).toBe('object');
    expect(Array.isArray(nelson)).toBe(false);
    expect(Object.keys(nelson).length).toBeGreaterThan(0);
  });

  it('every chapter key is a positive-integer string (non-meta keys)', () => {
    for (const k of Object.keys(nelson)) {
      if (k.startsWith('_')) continue;
      const n = Number(k);
      expect(Number.isInteger(n), `key ${k} is not an integer`).toBe(true);
      expect(n).toBeGreaterThan(0);
    }
  });

  it('every chapter entry has title (non-empty) and notes (non-empty); _meta has version/source', () => {
    const bad = [];
    for (const [k, e] of Object.entries(nelson)) {
      if (k.startsWith('_')) continue;
      if (typeof e.title !== 'string' || e.title.trim().length === 0) bad.push({ k, why: 'title' });
      if (typeof e.notes !== 'string' || e.notes.trim().length === 0) bad.push({ k, why: 'notes' });
    }
    expect(bad).toEqual([]);
    if (nelson._meta) {
      expect(typeof nelson._meta.version).toBe('number');
      expect(typeof nelson._meta.source).toBe('string');
    }
  });
});

describe('Cross-reference: questions.ti → topics.id', () => {
  let questions, topics;
  beforeAll(() => {
    questions = loadData('questions.json');
    topics = loadData('topics.json');
  });

  it('every question.ti maps to a defined topic id', () => {
    const ids = new Set(topics.map((t) => t.id));
    const orphans = questions.filter((q) => !ids.has(q.ti));
    expect(orphans.length, `${orphans.length} orphan ti values`).toBe(0);
  });

  test('every legacy topic ti has at least 5 questions', () => {
    const counts = new Map();
    for (const q of questions) counts.set(q.ti, (counts.get(q.ti) || 0) + 1);
    const sparse = topics
      .map((t) => ({ id: t.id, n: counts.get(t.id) || 0 }))
      .filter((x) => x.n < 5);
    expect(sparse).toEqual([]);
  });

  it('no single topic owns more than 25% of the question bank', () => {
    const counts = new Map();
    for (const q of questions) counts.set(q.ti, (counts.get(q.ti) || 0) + 1);
    const total = questions.length;
    const max = Math.max(...counts.values());
    expect(max / total).toBeLessThanOrEqual(0.25);
  });
});
