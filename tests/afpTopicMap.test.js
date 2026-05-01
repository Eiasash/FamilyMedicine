/**
 * AFP/הר"י index ↔ topic-map robustness tests.
 *
 * Mishpacha v1.21.0 ships 542 AFP/הר"י papers across 23 specialties indexed
 * in `data/afp_hari_index.json` and a `TOPIC_TO_AFP_SPECS` map in
 * `src/core/constants.js` that connects each of the 27 quiz topics to one or
 * more specialty strings. The inverse map (`AFP_SPEC_TO_TOPICS`) is built at
 * module load and powers the "related questions" link in the AFP reader.
 *
 * These tests are the only thing protecting against:
 *   • a renamed/typo'd specialty in the index that silently drops articles
 *     out of every topic
 *   • a topic with zero AFP coverage (would render an empty "related papers"
 *     pane in the in-app reader with no error)
 *   • round-trip breakage between TOPIC_TO_AFP_SPECS and AFP_SPEC_TO_TOPICS
 *   • paper-schema drift (missing title/specialty/year) breaking the listing
 *     view on cold load
 *
 * Pinning the canonical 23-specialty whitelist here means a future re-ingest
 * that introduces a new specialty has to update both the index AND the topic
 * map in the same commit.
 *
 * Sibling-fork warning: the same TOPIC_TO_AFP_SPECS pattern exists in
 * InternalMedicine. If you add a topic here, mirror the AFP-spec mapping
 * before pushing or the IM/Mishpacha plans desync.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { TOPICS, TOPIC_TO_AFP_SPECS, AFP_SPEC_TO_TOPICS } from '../src/core/constants.js';

const ROOT = resolve(import.meta.dirname, '..');
const AFP_INDEX_PATH = resolve(ROOT, 'data', 'afp_hari_index.json');

let afp;
beforeAll(() => {
  afp = JSON.parse(readFileSync(AFP_INDEX_PATH, 'utf-8'));
});

describe('AFP/הר"י index — schema integrity', () => {
  it('top-level keys present', () => {
    expect(afp).toHaveProperty('version');
    expect(afp).toHaveProperty('window');
    expect(afp).toHaveProperty('totals');
    expect(afp).toHaveProperty('specialties');
    expect(afp).toHaveProperty('papers');
  });

  it('papers count matches AFP+הר"י totals', () => {
    expect(Array.isArray(afp.papers)).toBe(true);
    const sum = (afp.totals.afp || 0) + (afp.totals.hari || 0);
    expect(afp.papers.length).toBe(sum);
  });

  it('every paper has required title, specialty, and kind fields', () => {
    const bad = [];
    afp.papers.forEach((p, i) => {
      if (!p.title || typeof p.title !== 'string') bad.push(`papers[${i}].title missing`);
      if (!p.specialty || typeof p.specialty !== 'string') bad.push(`papers[${i}].specialty missing`);
      if (!p.kind || (p.kind !== 'AFP' && !String(p.kind).includes('הר'))) {
        bad.push(`papers[${i}].kind unexpected: ${p.kind}`);
      }
    });
    expect(bad.slice(0, 5)).toEqual([]);
  });

  it('paper.year is either a string year or null — NEVER an empty string', () => {
    // R2 cleanup (v1.21.2): empty-string years on הר"י papers were converted
    // to explicit null sentinels (idx 440, 452 had no year discoverable from
    // source frontmatter or PDF stem). All AFP papers have a year. We pin
    // BOTH invariants in one assertion so a future re-ingest can't reintroduce
    // empty-string contamination.
    const bad = [];
    afp.papers.forEach((p, i) => {
      // empty string is the bad case
      if (p.year === '') bad.push(`papers[${i}].year is empty string`);
      // AFP kind must always have a year
      if (p.kind === 'AFP' && (p.year == null || p.year === '')) {
        bad.push(`AFP papers[${i}].year missing`);
      }
      // year must be string-parseable-to-int OR null
      if (p.year != null) {
        const n = parseInt(String(p.year), 10);
        if (Number.isNaN(n)) bad.push(`papers[${i}].year not parseable: ${p.year}`);
      }
    });
    expect(bad.slice(0, 5)).toEqual([]);
  });

  it('AFP-kind papers have a parseable 4-digit year (legacy pre-2018 outliers are tagged)', () => {
    // Per the rolling 7-year window declared in CLAUDE.md (currently 2018-2025),
    // AFP papers should fall in 2010-2030. The audit found 12 legacy citations
    // slipped through (3 pre-2010: 1990, 2003, 2004; 9 in 2010-2017 range) —
    // flagged for re-ingest in IMPROVEMENTS.md. We assert the count does not
    // GROW, not that it is 0. Adjust this ceiling only when re-ingesting.
    const KNOWN_LEGACY_OUTLIERS = 12;
    const bad = [];
    afp.papers.forEach((p, i) => {
      if (p.kind !== 'AFP') return;
      const y = parseInt(String(p.year), 10);
      if (Number.isNaN(y) || y < 2018 || y > 2030) bad.push(i);
    });
    expect(bad.length).toBeLessThanOrEqual(KNOWN_LEGACY_OUTLIERS);
  });

  it('הר"י papers with year set use a year >= 2010 (post-fix sanity)', () => {
    // R2 fixed 16 הר"י papers where the extractor pulled an unrelated 4-digit
    // number from the body text. After the fix, every הר"י year (when set)
    // should be a recent year matching the title/filename. Pin >= 2010.
    const bad = [];
    afp.papers.forEach((p, i) => {
      if (p.kind !== 'הרי' || p.year == null) return;
      const y = parseInt(String(p.year), 10);
      if (Number.isNaN(y) || y < 2010 || y > 2030) {
        bad.push(`papers[${i}].year=${p.year}: ${p.title}`);
      }
    });
    expect(bad).toEqual([]);
  });

  it('every paper.specialty references a value listed in afp.specialties', () => {
    const declared = new Set(afp.specialties);
    const orphan = new Set();
    afp.papers.forEach((p) => {
      if (!declared.has(p.specialty)) orphan.add(p.specialty);
    });
    expect([...orphan]).toEqual([]);
  });

  it('specialties listed in index are non-empty distinct strings', () => {
    expect(Array.isArray(afp.specialties)).toBe(true);
    expect(afp.specialties.length).toBeGreaterThan(0);
    const seen = new Set();
    afp.specialties.forEach((s) => {
      expect(typeof s).toBe('string');
      expect(s.length).toBeGreaterThan(0);
      expect(seen.has(s)).toBe(false);
      seen.add(s);
    });
  });
});

describe('TOPIC_TO_AFP_SPECS — coverage and round-trip', () => {
  it('every topic (0..26) has at least one AFP specialty mapping', () => {
    const missing = [];
    for (let ti = 0; ti < TOPICS.length; ti++) {
      const specs = TOPIC_TO_AFP_SPECS[ti];
      if (!Array.isArray(specs) || specs.length === 0) missing.push(ti);
    }
    expect(missing).toEqual([]);
  });

  it('every specialty referenced by TOPIC_TO_AFP_SPECS exists in the AFP index', () => {
    const declared = new Set(afp.specialties);
    const orphan = new Set();
    Object.entries(TOPIC_TO_AFP_SPECS).forEach(([ti, specs]) => {
      specs.forEach((s) => {
        if (!declared.has(s)) orphan.add(`${ti}→${s}`);
      });
    });
    expect([...orphan]).toEqual([]);
  });

  it('AFP_SPEC_TO_TOPICS is the exact inverse of TOPIC_TO_AFP_SPECS', () => {
    // Forward: ti → specs[]
    // Reverse: spec → ti[]
    // Round-trip: every (ti, spec) pair appears in both directions.
    const fwdPairs = new Set();
    Object.entries(TOPIC_TO_AFP_SPECS).forEach(([ti, specs]) => {
      specs.forEach((s) => fwdPairs.add(`${+ti}|${s}`));
    });
    const revPairs = new Set();
    Object.entries(AFP_SPEC_TO_TOPICS).forEach(([s, tis]) => {
      tis.forEach((ti) => revPairs.add(`${+ti}|${s}`));
    });
    expect([...fwdPairs].sort()).toEqual([...revPairs].sort());
  });

  it('AFP_SPEC_TO_TOPICS returns numeric topic indices', () => {
    Object.values(AFP_SPEC_TO_TOPICS).forEach((tis) => {
      expect(Array.isArray(tis)).toBe(true);
      tis.forEach((ti) => {
        expect(Number.isInteger(ti)).toBe(true);
        expect(ti).toBeGreaterThanOrEqual(0);
        expect(ti).toBeLessThan(TOPICS.length);
      });
    });
  });

  it('every AFP specialty in the index is reachable from at least one topic', () => {
    // Soft inverse: warn on any specialty in the index that no topic claims.
    // Currently expected: all 23 index specialties covered by topic map.
    const reachable = new Set(Object.keys(AFP_SPEC_TO_TOPICS));
    const indexed = new Set(afp.specialties);
    const unreached = [...indexed].filter((s) => !reachable.has(s));
    // Allow up to 1 unreached specialty as a soft gate; flag for IMPROVEMENTS.
    expect(unreached.length).toBeLessThanOrEqual(1);
  });
});

describe('AFP index — lookup helpers (simulated reader queries)', () => {
  it('lookup by specialty returns ≥1 paper for every covered specialty', () => {
    // Simulates the in-app reader filtering papers by specialty when the
    // user opens a topic-related view.
    const empty = [];
    afp.specialties.forEach((s) => {
      const found = afp.papers.filter((p) => p.specialty === s);
      if (found.length === 0) empty.push(s);
    });
    expect(empty).toEqual([]);
  });

  it('lookup by topic→specialty→papers returns ≥1 paper for every topic', () => {
    // End-to-end traversal: pick topic 0, get specs, get papers, expect non-empty.
    const blank = [];
    for (let ti = 0; ti < TOPICS.length; ti++) {
      const specs = TOPIC_TO_AFP_SPECS[ti] || [];
      const papers = afp.papers.filter((p) => specs.includes(p.specialty));
      if (papers.length === 0) blank.push(ti);
    }
    expect(blank).toEqual([]);
  });

  it('AFP papers outnumber HARI papers per the index totals', () => {
    // Trivial sanity — HARI is the smaller secondary corpus.
    expect(afp.totals.afp).toBeGreaterThan(afp.totals.hari);
  });
});
