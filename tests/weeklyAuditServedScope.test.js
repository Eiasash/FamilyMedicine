import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

// Regression guard for the weekly-audit "conflicting duplicates" gate
// (.github/workflows/weekly-audit.yml). The gate was rescoped to SERVED rows
// only: soft-retired (dup) / out-of-pool (broken) rows are filtered from every
// quiz pool (app.js / modes.js / more-view.js), so a conflict between a served
// row and its dead, often OCR-drifted retired copy is noise — it reddened CI
// over data no user ever sees. This test pins three invariants:
//   1. Exclusion only REMOVES conflicts, never adds (served-only ⊆ all-rows).
//   2. Every dropped conflict involves ≥1 retired row — i.e. no served-vs-served
//      conflict is ever silenced. A served/in-pool OCR-drift MUST still flag.
//   3. Excluded == exactly the dup/broken rows; no served row is excluded.
const qs = JSON.parse(readFileSync('data/questions.json', 'utf8'));

const isRetired = (q) => Boolean(q.dup || q.broken);

// Mirror of the gate's conflict logic (compare chosen-option TEXT, respect
// c_accept, walk all prior same-stem occurrences). excludeRetired toggles the
// new served-only scope.
function gateConflicts(excludeRetired) {
  const seen = new Map(); // stem -> [prior indices]
  const conflicts = [];
  let excluded = 0;
  qs.forEach((q, i) => {
    if (excludeRetired && isRetired(q)) { excluded++; return; }
    const key = (q.q || '').trim().slice(0, 80);
    const priors = seen.get(key) || [];
    for (const j of priors) {
      const qi = qs[i], qj = qs[j];
      if (qi.c === qj.c) continue;
      const ti = qi.c < qi.o.length ? qi.o[qi.c].trim() : null;
      const tj = qj.c < qj.o.length ? qj.o[qj.c].trim() : null;
      if (ti && tj && ti === tj) continue; // re-ordered options, same answer
      const ca = (qj.c_accept || []).includes(qi.c) || (qi.c_accept || []).includes(qj.c);
      if (ca) continue; // chosen answers cross-accepted
      conflicts.push([j, i]);
    }
    seen.set(key, [...priors, i]);
  });
  return { conflicts, excluded };
}

const keyOf = ([j, i]) => `${j}-${i}`;

describe('weekly-audit conflict gate — served-only scope', () => {
  const all = gateConflicts(false);
  const served = gateConflicts(true);

  it('served-only conflicts are a subset of all-rows conflicts (exclusion only removes)', () => {
    const allSet = new Set(all.conflicts.map(keyOf));
    for (const c of served.conflicts) expect(allSet.has(keyOf(c))).toBe(true);
  });

  it('every conflict DROPPED by the served-only scope involves a retired row (no served-vs-served ever silenced)', () => {
    const servedSet = new Set(served.conflicts.map(keyOf));
    const dropped = all.conflicts.filter((c) => !servedSet.has(keyOf(c)));
    for (const [j, i] of dropped) {
      expect(isRetired(qs[j]) || isRetired(qs[i])).toBe(true);
    }
  });

  it('every RETAINED conflict is served-vs-served (a live OCR-drift still flags)', () => {
    for (const [j, i] of served.conflicts) {
      expect(isRetired(qs[j])).toBe(false);
      expect(isRetired(qs[i])).toBe(false);
    }
  });

  it('excluded count equals the dup/broken row count; no served row is excluded', () => {
    const retiredCount = qs.filter(isRetired).length;
    expect(served.excluded).toBe(retiredCount);
    expect(qs.length - served.excluded).toBe(qs.filter((q) => !isRetired(q)).length);
  });
});
