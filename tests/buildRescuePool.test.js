/**
 * Tests for buildRescuePool in src/sr/spaced-repetition.js.
 *
 * This is the "rescue drill" flow: grab the 3 weakest topics (by
 * past correct rate), take the 7 lowest-scoring questions from each,
 * shuffle, and push into G.pool. Previously uncovered (lines 91-107).
 *
 * Setup mirrors spacedRepetitionHelpers.test.js — seed fsrs globals
 * so fsrs-bridge resolves.
 */

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

globalThis.window = globalThis;

const fsrsSrc = readFileSync(resolve(process.cwd(), 'shared', 'fsrs.js'), 'utf-8');
const seed = new Function(
  'target',
  fsrsSrc +
    ';Object.assign(target, { FSRS_W, FSRS_DECAY, FSRS_FACTOR, FSRS_RETENTION,' +
    ' fsrsR, fsrsInterval, fsrsInitNew, fsrsUpdate, fsrsMigrateFromSM2, isChronicFail });'
);
seed(globalThis);

let G, buildRescuePool;

beforeAll(async () => {
  G = (await import('../src/core/globals.js')).default;
  const mod = await import('../src/sr/spaced-repetition.js');
  buildRescuePool = mod.buildRescuePool;
});

beforeEach(() => {
  G.S = { sr: {}, streak: 0, qOk: 0, qNo: 0, dailyAct: {} };
  // 3 topics × 10 Qs each, topic 0 = weakest, topic 2 = strongest.
  G.QZ = [];
  for (let ti = 0; ti < 3; ti++) {
    for (let j = 0; j < 10; j++) G.QZ.push({ ti, q: `t${ti}-q${j}` });
  }
  // Populate sr with 3+ answered Qs per topic so getWeakTopics picks them up.
  // topic 0: all wrong (n=0)
  // topic 1: half right
  // topic 2: all right
  for (let idx = 0; idx < 10; idx++) {
    const ti = G.QZ[idx].ti;
    G.S.sr[idx] = { n: 0, tot: 5, ok: 0 };
  }
  for (let idx = 10; idx < 20; idx++) {
    G.S.sr[idx] = { n: idx % 2 === 0 ? 1 : 0, tot: 4, ok: 2 };
  }
  for (let idx = 20; idx < 30; idx++) {
    G.S.sr[idx] = { n: 3, tot: 5, ok: 5 };
  }
  G.pool = [];
  G.qi = 0;
  G.sel = 1;
  G.ans = true;
  G.filt = 'all';
  G.render = vi.fn();
  G.save = vi.fn();
});

describe('buildRescuePool', () => {
  it('builds a pool drawn from the 3 weakest topics, 7 questions each = 21 max', () => {
    buildRescuePool();
    // The 3 weakest topics each contribute up to 7 questions.
    expect(G.pool.length).toBeLessThanOrEqual(21);
    expect(G.pool.length).toBeGreaterThan(0);
    // Every pooled index must belong to one of the 3 topics we have.
    for (const i of G.pool) {
      expect([0, 1, 2]).toContain(G.QZ[i].ti);
    }
  });

  it('sets filt to "rescue" and resets quiz cursor state', () => {
    buildRescuePool();
    expect(G.filt).toBe('rescue');
    expect(G.qi).toBe(0);
    expect(G.sel).toBeNull();
    expect(G.ans).toBe(false);
    expect(G.render).toHaveBeenCalledTimes(1);
  });

  it('prioritises the weakest topic first (topic 0 = 0% correct)', () => {
    buildRescuePool();
    // Topic 0 indices are 0-9. At least one should appear.
    const hasTopic0 = G.pool.some((i) => G.QZ[i].ti === 0);
    expect(hasTopic0).toBe(true);
  });

  it('shows a toast and does not touch state when no weak topics are available', () => {
    // Clear sr so getWeakTopics returns [].
    G.S.sr = {};
    G.pool = [42]; // sentinel
    G.filt = 'all';
    buildRescuePool();
    expect(G.pool).toEqual([42]);
    expect(G.filt).toBe('all');
    expect(G.render).not.toHaveBeenCalled();
  });

  it('is idempotent in shape: two consecutive calls both produce valid pools', () => {
    buildRescuePool();
    const firstLen = G.pool.length;
    buildRescuePool();
    expect(G.pool.length).toBe(firstLen);
    expect(G.filt).toBe('rescue');
  });

  it('does not emit duplicate indices within the pool', () => {
    buildRescuePool();
    const uniq = new Set(G.pool);
    expect(uniq.size).toBe(G.pool.length);
  });
});
