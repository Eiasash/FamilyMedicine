/**
 * FM-4 (2026-07-15): buildDrillPool overdue ranking reads `.next`, not `.due`.
 *
 * SR entries created by srScore carry `.next` (the FSRS-scheduled review time),
 * never `.due`. The old `s.due && s.due<now` test was dead — overdue always
 * scored 0, so genuinely-overdue questions never got their +2 rank boost.
 *
 * Bootstrap mirrors drillTarget.test.js (fsrs seed + localStorage + DOM shim).
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

const _lsStore = new Map();
globalThis.localStorage = {
  getItem: (k) => (_lsStore.has(k) ? _lsStore.get(k) : null),
  setItem: (k, v) => _lsStore.set(k, String(v)),
  removeItem: (k) => _lsStore.delete(k),
  clear: () => _lsStore.clear(),
};

let G, buildDrillPool;
beforeAll(async () => {
  G = (await import('../src/core/globals.js')).default;
  buildDrillPool = (await import('../src/sr/spaced-repetition.js')).buildDrillPool;
});

beforeEach(() => {
  globalThis.document = {
    body: { children: [], appendChild() {} },
    getElementById: () => null,
    createElement: () => ({ id: '', innerHTML: '', style: {}, appendChild() {}, remove() {} }),
  };
  G.S = { sr: {}, qOk: 0, qNo: 0, dailyAct: {} };
  G.QZ = [];
  for (let ti = 0; ti < 27; ti++) {
    for (let j = 0; j < 5; j++) G.QZ.push({ ti, q: `t${ti}-q${j}`, o: ['a', 'b', 'c', 'd'], c: 0 });
  }
  G.pool = [];
  G.qi = 0; G.sel = null; G.ans = false; G.filt = 'all';
  G.render = vi.fn();
  G.save = vi.fn();
});

describe('FM-4: buildDrillPool prioritises overdue items via .next', () => {
  it('surfaces a .next-overdue card ahead of higher-accuracy non-overdue cards', () => {
    const now = Date.now();
    const ti = 3;
    const start = ti * 5; // indices 15..19 in the fixture

    // Overdue card: perfect accuracy → WITHOUT the overdue bonus it ranks LAST
    // (acc=1 → base -3). Its `.next` is 3 days in the past.
    G.S.sr[start] = { tot: 5, ok: 5, n: 5, next: now - 3 * 86400000 };
    // The other four: lower accuracy (rank higher on accuracy alone), NOT overdue.
    for (let i = start + 1; i < start + 5; i++) {
      G.S.sr[i] = { tot: 2, ok: 1, n: 1, next: now + 10 * 86400000 };
    }

    buildDrillPool(ti, 5);

    // Only the `.next`-aware overdue read puts the perfect-accuracy card first.
    // Reading the dead `.due` field would rank it LAST — the regression fails there.
    expect(G.pool[0]).toBe(start);
    expect(G.pool).toContain(start);
  });
});
