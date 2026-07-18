/**
 * FSRS difficulty-anchor correction (2026-07-18).
 *
 * Proves the corrected fsrsUpdate() mean-reverts difficulty toward the canonical
 * FSRS-4.5 initial-Easy difficulty D0_Easy (~3.28 = fsrsInitNew(4).d) instead of
 * the old, incorrect anchor FSRS_W[4] (~7.21).
 *
 * Difficulty recurrence for a Good review (rating=3) is INDEPENDENT of stability
 * and rPrev:
 *   newD = clamp( d + W7*(D0_Easy - d) ),  W7 = FSRS_W[7] = 0.06362
 *        = 0.93638*d + 0.208853          (fixed point d* = D0_Easy = 3.2828)
 *
 * Recomputed reference values (d0 = 7, repeated Good):
 *   D0_Easy          = 7.2102 - e^(0.5316*3) + 1 = 3.2828
 *   fsrsInitNew(4).d = 3.2828
 *   after 1 Good  d1 = 6.7635   (DOWN from 7 — the fix; OLD anchor gave 7.0134, UP)
 *   after 2 Goods d2 = 6.5421
 *   after 3 Goods d3 = 6.3347
 *   ... strictly decreasing, converging to 3.2828 (NOT rising to 7.21)
 *
 * fsrs seed pattern mirrors sharedFsrs / fsrsProperties tests.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

let F, D0;
beforeAll(() => {
  const code = readFileSync(join(__dirname, "..", "shared", "fsrs.js"), "utf-8");
  F = new Function(
    code +
      "\nreturn {FSRS_W,FSRS_DECAY,FSRS_FACTOR,FSRS_RETENTION,fsrsR,fsrsInterval,fsrsInitNew,fsrsUpdate};"
  )();
  D0 = Math.min(10, Math.max(1, F.FSRS_W[4] - Math.exp(F.FSRS_W[5] * 3) + 1));
});

describe("FSRS D-anchor correction (2026-07-18)", () => {
  it("D0_Easy and fsrsInitNew(4).d both equal ~3.28", () => {
    expect(D0).toBeCloseTo(3.28, 2);
    expect(F.fsrsInitNew(4).d).toBeCloseTo(3.28, 2);
    expect(F.fsrsInitNew(4).d).toBeCloseTo(D0, 6);
  });

  it("repeated Good from d=7 drives difficulty DOWN toward ~3.28 (not up to 7.21)", () => {
    let d = 7, s = 5;
    const ds = [];
    for (let i = 0; i < 40; i++) {
      const out = F.fsrsUpdate(s, d, 0.9, 3);
      d = out.d; s = out.s;
      ds.push(d);
    }
    // First Good already DECREASES D (the correction). The old FSRS_W[4] anchor
    // would have increased it to ~7.0134 instead.
    expect(ds[0]).toBeLessThan(7);
    expect(ds[0]).toBeCloseTo(6.7635, 3);
    // Strictly monotonic decrease, bounded below by D0_Easy.
    for (let i = 1; i < ds.length; i++) {
      expect(ds[i]).toBeLessThan(ds[i - 1]);
      expect(ds[i]).toBeGreaterThan(D0 - 1e-9);
    }
    // Converges toward D0_Easy, NOT toward the old FSRS_W[4] (~7.21) anchor.
    const last = ds[ds.length - 1];
    expect(Math.abs(last - D0)).toBeLessThan(Math.abs(last - F.FSRS_W[4]));
    expect(last).toBeLessThan(5);
  });

  it("difficulty converges to D0_Easy under sustained Good reviews", () => {
    let d = 7, s = 5;
    for (let i = 0; i < 200; i++) {
      const out = F.fsrsUpdate(s, d, 0.9, 3);
      d = out.d; s = out.s;
    }
    expect(d).toBeCloseTo(D0, 3);
  });

  it("stability and review interval grow across repeated Good reviews", () => {
    let d = 7, s = 5;
    const intervals = [F.fsrsInterval(s)];
    const stabilities = [s];
    for (let i = 0; i < 6; i++) {
      const out = F.fsrsUpdate(s, d, 0.9, 3);
      d = out.d; s = out.s;
      stabilities.push(s);
      intervals.push(F.fsrsInterval(s));
    }
    // Good always increases stability.
    for (let i = 1; i < stabilities.length; i++) {
      expect(stabilities[i]).toBeGreaterThan(stabilities[i - 1]);
    }
    // Interval grows overall and never shrinks.
    for (let i = 1; i < intervals.length; i++) {
      expect(intervals[i]).toBeGreaterThanOrEqual(intervals[i - 1]);
    }
    expect(intervals[intervals.length - 1]).toBeGreaterThan(intervals[0]);
  });
});
