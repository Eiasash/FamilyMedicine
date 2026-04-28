// Wrong-answer review mode — quiz filter that surfaces previously-wrong Qs,
// sorted by recency × topic weight (IMA_WEIGHTS). Persisted across reloads via
// G.S.wrongSet so the user can come back to the same review list. After 2
// consecutive correct answers a Q is auto-evicted ("no longer wrong").
//
// State shape on G.S.wrongSet:
//   { [qIdx:string]: { firstWrongAt:ms, lastWrongAt:ms, consecutiveOk:int } }
//
// Public API:
//   markWrong(qIdx)              — record a wrong answer
//   markCorrect(qIdx)            — record a correct answer (evicts after 2 in a row)
//   getWrongSet()                — return the raw map (live)
//   getWrongAnswerCount()        — int (size of wrong set)
//   getWrongAnswerPool()         — sorted [qIdx, ...] by recency × IMA weight
//   buildWrongReviewPool()       — installs G.pool, sets G.filt='wrong-review', renders
//   resetWrongSet()              — wipes the persisted set (used by "Clear" UI)

import G from '../core/globals.js';
import { IMA_WEIGHTS } from '../core/constants.js';
import { toast } from '../core/utils.js';

// Localstorage / state key. Lives inside G.S so it rides on the existing save
// + cloud-backup paths — no extra plumbing needed.
const FIELD = 'wrongSet';

// 2 consecutive correct answers evicts a Q from the wrong-answer set. Tunable.
export const EVICT_THRESHOLD = 2;

function ensure() {
  if (!G.S) return null;
  if (!G.S[FIELD] || typeof G.S[FIELD] !== 'object') G.S[FIELD] = {};
  return G.S[FIELD];
}

export function getWrongSet() {
  return ensure() || {};
}

export function getWrongAnswerCount() {
  const s = ensure();
  return s ? Object.keys(s).length : 0;
}

// Mark a question as wrong. Idempotent — bumping lastWrongAt + zeroing the
// consecutive-correct streak.
export function markWrong(qIdx) {
  const s = ensure();
  if (!s) return;
  const key = String(qIdx);
  const now = Date.now();
  const existing = s[key];
  if (existing) {
    existing.lastWrongAt = now;
    existing.consecutiveOk = 0;
  } else {
    s[key] = { firstWrongAt: now, lastWrongAt: now, consecutiveOk: 0 };
  }
  if (typeof G.save === 'function') G.save();
}

// Record a correct answer. If the Q wasn't in the wrong set, this is a no-op.
// Otherwise increment consecutiveOk and evict at >= EVICT_THRESHOLD.
// Returns true iff the Q was evicted as a result of this call.
export function markCorrect(qIdx) {
  const s = ensure();
  if (!s) return false;
  const key = String(qIdx);
  const entry = s[key];
  if (!entry) return false;
  entry.consecutiveOk = (entry.consecutiveOk || 0) + 1;
  if (entry.consecutiveOk >= EVICT_THRESHOLD) {
    delete s[key];
    if (typeof G.save === 'function') G.save();
    return true;
  }
  if (typeof G.save === 'function') G.save();
  return false;
}

// Compute the ordered review pool. Higher score = appears earlier.
//
//   recencyFactor  = 1 / (1 + daysSinceLastWrong)   in (0,1], weighted by recency
//   weightFactor   = IMA_WEIGHTS[ti] / maxWeight    normalized to (0,1]
//   score          = recencyFactor * (0.4 + 0.6 * weightFactor)
//
// The 0.4 + 0.6 mix means even a low-weight topic still gets a meaningful
// score; recency dominates in the short term, weight breaks ties on older items.
//
// Stale Qs (>365 days) and Qs no longer in G.QZ are pruned so the pool stays
// useful even after a corpus refresh.
export function getWrongAnswerPool() {
  const s = ensure();
  if (!s) return [];
  const QZ = G.QZ || [];
  const wts = Array.isArray(IMA_WEIGHTS) && IMA_WEIGHTS.length ? IMA_WEIGHTS : null;
  const maxWt = wts ? Math.max(...wts) : 1;
  const now = Date.now();
  const STALE_DAYS = 365;
  const out = [];
  Object.entries(s).forEach(([key, e]) => {
    const idx = parseInt(key, 10);
    const q = QZ[idx];
    if (!q) return; // pruned silently — Q removed from corpus
    const days = (now - (e.lastWrongAt || now)) / 86400000;
    if (days > STALE_DAYS) return; // pruned silently — too old
    const recencyFactor = 1 / (1 + days);
    let weightFactor = 0.5;
    if (wts && typeof q.ti === 'number' && q.ti >= 0 && q.ti < wts.length && maxWt > 0) {
      weightFactor = wts[q.ti] / maxWt;
    }
    const score = recencyFactor * (0.4 + 0.6 * weightFactor);
    out.push({ idx, score, lastWrongAt: e.lastWrongAt, ti: q.ti });
  });
  out.sort((a, b) => b.score - a.score);
  return out.map((x) => x.idx);
}

// Switch the quiz into wrong-review mode. Pool = getWrongAnswerPool(); empty
// pool produces an info toast and bails out so we don't strand the user.
export function buildWrongReviewPool() {
  const pool = getWrongAnswerPool();
  if (!pool.length) {
    toast('No wrong answers to review. Great job!', 'success');
    return false;
  }
  G.pool = pool;
  G.qi = 0;
  G.sel = null;
  G.ans = false;
  G.autopsyDistractor = -1;
  G.teachBackState = null;
  G._optShuffle = null;
  G._confidence = null;
  G._wrongReason = null;
  G._diffRating = null;
  G.filt = 'wrong-review';
  G.topicFilt = -1;
  G.years = [];
  if (typeof G.render === 'function') G.render();
  return true;
}

// Wipe the persisted wrong-answer set. Useful for the UI "Clear" button.
export function resetWrongSet() {
  if (!G.S) return;
  G.S[FIELD] = {};
  if (typeof G.save === 'function') G.save();
}
