/**
 * Shape and range validation for src/core/constants.js.
 *
 * These tests ensure the structural invariants of the shared constants that
 * drive quiz weighting, topic labelling, and exam-year filtering remain intact
 * as the corpus grows.
 */

import { describe, it, expect } from 'vitest';
import {
  TOPICS,
  IMA_WEIGHTS,
  EXAM_FREQ,
  EXAM_YEARS,
  APP_VERSION,
  SYLLABUS_VERSION,
  LS,
} from '../src/core/constants.js';

const TOPIC_COUNT = 27; // P0062-2025 Family Medicine syllabus

describe('TOPICS', () => {
  it(`has exactly ${TOPIC_COUNT} entries`, () => {
    expect(TOPICS).toHaveLength(TOPIC_COUNT);
  });

  it('every entry is a non-empty string', () => {
    TOPICS.forEach((t, i) => {
      expect(typeof t, `TOPICS[${i}]`).toBe('string');
      expect(t.trim().length, `TOPICS[${i}] is blank`).toBeGreaterThan(0);
    });
  });

  it('contains key family medicine topics', () => {
    // Spot-check a representative sample; ti values must stay stable.
    expect(TOPICS[0]).toMatch(/Cardiology|IHD|Arrhythmia/i);
    expect(TOPICS[6]).toMatch(/Diabetes/i);
    expect(TOPICS[26]).toMatch(/EBM|Communication|Family/i);
  });

  it('indices 0–26 all exist (no gaps)', () => {
    for (let i = 0; i < TOPIC_COUNT; i++) {
      expect(TOPICS[i]).toBeDefined();
    }
  });
});

describe('IMA_WEIGHTS', () => {
  it(`has exactly ${TOPIC_COUNT} entries`, () => {
    expect(IMA_WEIGHTS).toHaveLength(TOPIC_COUNT);
  });

  it('every weight is a non-negative integer', () => {
    IMA_WEIGHTS.forEach((w, i) => {
      expect(Number.isInteger(w), `IMA_WEIGHTS[${i}]=${w} is not an integer`).toBe(true);
      expect(w, `IMA_WEIGHTS[${i}]=${w} is negative`).toBeGreaterThanOrEqual(0);
    });
  });

  it('total weight is positive (at least one non-zero topic)', () => {
    const total = IMA_WEIGHTS.reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThan(0);
  });
});

describe('EXAM_FREQ', () => {
  it(`has exactly ${TOPIC_COUNT} entries`, () => {
    expect(EXAM_FREQ).toHaveLength(TOPIC_COUNT);
  });

  it('every frequency is a non-negative integer', () => {
    EXAM_FREQ.forEach((f, i) => {
      expect(Number.isInteger(f), `EXAM_FREQ[${i}]=${f} is not an integer`).toBe(true);
      expect(f, `EXAM_FREQ[${i}]=${f} is negative`).toBeGreaterThanOrEqual(0);
    });
  });

  it('total frequency matches known corpus size (±10%)', () => {
    const total = EXAM_FREQ.reduce((a, b) => a + b, 0);
    // The 7-session corpus has 885 questions; allow ±10% for future ingestion.
    const EXPECTED_CORPUS_SIZE = 885;
    const TOLERANCE = 0.1;
    expect(total).toBeGreaterThanOrEqual(Math.floor(EXPECTED_CORPUS_SIZE * (1 - TOLERANCE)));
    expect(total).toBeLessThanOrEqual(Math.ceil(EXPECTED_CORPUS_SIZE * (1 + TOLERANCE)));
  });
});

describe('EXAM_YEARS', () => {
  it('contains exactly 7 canonical session tokens', () => {
    expect(EXAM_YEARS).toHaveLength(7);
  });

  it('contains all expected canonical tokens', () => {
    const expected = ['2020', '2021-Jun', '2022-Jun', '2023-Jun', '2024-May', '2024-Sep', '2025-Jun'];
    for (const t of expected) {
      expect(EXAM_YEARS, `missing ${t}`).toContain(t);
    }
  });

  it('does NOT contain any legacy short-form tokens (pre-migration)', () => {
    const legacyForms = ['Jun21', 'Jun22', 'Jun23', 'May24', 'Oct24', '2024-Oct', 'Jun25'];
    for (const legacy of legacyForms) {
      expect(EXAM_YEARS, `legacy token ${legacy} found in EXAM_YEARS`).not.toContain(legacy);
    }
  });

  it('every token is a non-empty string', () => {
    EXAM_YEARS.forEach((y, i) => {
      expect(typeof y, `EXAM_YEARS[${i}]`).toBe('string');
      expect(y.trim().length).toBeGreaterThan(0);
    });
  });
});

describe('APP_VERSION', () => {
  it('is a non-empty string', () => {
    expect(typeof APP_VERSION).toBe('string');
    expect(APP_VERSION.trim().length).toBeGreaterThan(0);
  });

  it('matches semver pattern (e.g. 1.2.8)', () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+(\.\d+)?$/);
  });
});

describe('SYLLABUS_VERSION', () => {
  it('is defined and non-empty', () => {
    expect(typeof SYLLABUS_VERSION).toBe('string');
    expect(SYLLABUS_VERSION.trim().length).toBeGreaterThan(0);
  });
});

describe('LS (localStorage key)', () => {
  it('is the canonical mishpacha_mega key', () => {
    expect(LS).toBe('mishpacha_mega');
  });
});
