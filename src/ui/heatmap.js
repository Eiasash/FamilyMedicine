// Topic mastery heatmap — SVG grid of all 27 FM topics.
// Colored by mean FSRS R (retention probability). 5-step Viridis colorblind-safe
// scale. Cells are tappable → opens topic-filtered quiz.
//
// Public API:
//   renderHeatmap()          → string of HTML containing an inline <svg>
//   getTopicMastery()        → array of { ti, name, rMean, n, attempted } (27 entries)
//   bucketize(r)             → 0..4 (which Viridis bucket the R-value falls into)
//
// Design notes:
//   * R-value comes from FSRS (shared/fsrs.js → fsrsR). For each Q with FSRS state
//     we compute R as of now, then average per topic. Topics with no answered
//     questions show as "no data" (gray).
//   * 5-step Viridis is approximated to colorblind-safe palette
//     ['#440154','#3b528b','#21918c','#5ec962','#fde725'].
//     0 = darkest purple (R<0.5, weakest mastery)
//     4 = bright yellow  (R>=0.9, strongest mastery)
//   * Grid layout: 9 cols × 3 rows fits 27 topics cleanly in mobile width.
//   * Click handler uses data-action="goto-quiz-topic" + data-ti — same as the
//     legacy topic-mastery map in track-view, so no new event delegation needed.

import G from '../core/globals.js';
import { TOPICS } from '../core/constants.js';
import { fsrsR } from '../sr/fsrs-bridge.js';
import { sanitize } from '../core/utils.js';

// 5-step Viridis colorblind-safe palette (Berkeley Lab CMap, evenly sampled).
// Verified by Color Oracle (deuteranopia + protanopia + tritanopia).
export const VIRIDIS_5 = ['#440154', '#3b528b', '#21918c', '#5ec962', '#fde725'];
export const NO_DATA_COLOR = '#e2e8f0';

// Map a retention probability R in [0,1] to a 5-step bucket.
// Bands: R<0.5 → 0, [0.5,0.65) → 1, [0.65,0.8) → 2, [0.8,0.9) → 3, ≥0.9 → 4.
// These cutoffs match commonly-cited FSRS retention regimes (Piotr Wozniak's
// "desirable difficulty" range is 0.8-0.9; <0.5 is essentially forgotten).
export function bucketize(r) {
  if (typeof r !== 'number' || isNaN(r)) return 0;
  if (r < 0.5) return 0;
  if (r < 0.65) return 1;
  if (r < 0.8) return 2;
  if (r < 0.9) return 3;
  return 4;
}

// Compute per-topic mastery from G.S.sr (FSRS state) and G.QZ (questions).
// For each topic ti: take all answered Qs (have FSRS state), compute current R,
// average. Returns sorted by ti so the grid order is stable.
export function getTopicMastery() {
  const out = [];
  const byTopic = {};
  const sr = (G.S && G.S.sr) || {};
  const QZ = G.QZ || [];

  // Bucket SR entries by topic.
  Object.entries(sr).forEach(([idx, s]) => {
    const q = QZ[idx];
    if (!q || typeof q.ti !== 'number') return;
    if (!s || typeof s.fsrsS !== 'number') return; // only FSRS-tracked items count
    const days = s.lastReview ? Math.max(0, (Date.now() - s.lastReview) / 86400000) : 0;
    let r;
    try {
      r = fsrsR(days, s.fsrsS);
    } catch (e) {
      r = NaN;
    }
    if (typeof r !== 'number' || isNaN(r)) return;
    if (!byTopic[q.ti]) byTopic[q.ti] = { sum: 0, n: 0 };
    byTopic[q.ti].sum += r;
    byTopic[q.ti].n += 1;
  });

  for (let ti = 0; ti < TOPICS.length; ti++) {
    const b = byTopic[ti];
    const rMean = b && b.n > 0 ? b.sum / b.n : null;
    out.push({
      ti,
      name: TOPICS[ti],
      rMean,
      n: b ? b.n : 0,
      attempted: !!(b && b.n > 0),
    });
  }
  return out;
}

// Render the heatmap as an inline SVG inside a card. Returns an HTML string.
// 9 cols × 3 rows = 27 cells. Each cell is data-action="goto-quiz-topic"
// with data-ti, so existing event delegation in track-view fires the topic-filter.
//
// The legend below the grid spells out the bucket → R-band mapping.
export function renderHeatmap() {
  const data = getTopicMastery();
  const COLS = 9;
  const ROWS = 3;
  // SVG viewBox uses 100×100 cell units so the layout scales fluidly with width.
  const CELL = 100;
  const GAP = 6;
  const W = COLS * CELL + (COLS + 1) * GAP;
  const H = ROWS * CELL + (ROWS + 1) * GAP;

  const totalAttempted = data.filter((d) => d.attempted).length;
  const subtitle = totalAttempted === 0
    ? 'Answer questions to see your mastery'
    : `${totalAttempted}/27 topics started · tap a cell to drill`;

  let cells = '';
  data.forEach((d, idx) => {
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    const x = GAP + col * (CELL + GAP);
    const y = GAP + row * (CELL + GAP);
    const bucket = d.attempted ? bucketize(d.rMean) : -1;
    const fill = bucket === -1 ? NO_DATA_COLOR : VIRIDIS_5[bucket];
    // Text color: dark on the bright (yellow) end, white on the dark end.
    const textColor = bucket >= 3 ? '#0f172a' : '#fff';
    const labelText = d.attempted ? Math.round(d.rMean * 100) + '%' : '·';
    const subText = d.attempted ? d.n + 'q' : '';
    const tipR = d.attempted ? `R=${d.rMean.toFixed(2)} · ${d.n} attempts` : 'no data yet';
    const title = sanitize(`${d.name} — ${tipR}`);
    cells +=
      `<g data-action="goto-quiz-topic" data-ti="${d.ti}" style="cursor:pointer">` +
      `<title>${title}</title>` +
      `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="14" ry="14" ` +
      `fill="${fill}" stroke="#cbd5e1" stroke-width="1" />` +
      `<text x="${x + CELL / 2}" y="${y + CELL / 2 - 4}" text-anchor="middle" ` +
      `dominant-baseline="middle" font-size="28" font-weight="700" fill="${textColor}" ` +
      `font-family="Inter,system-ui,sans-serif">${labelText}</text>` +
      `<text x="${x + CELL / 2}" y="${y + CELL / 2 + 24}" text-anchor="middle" ` +
      `dominant-baseline="middle" font-size="16" fill="${textColor}" opacity="0.85" ` +
      `font-family="Inter,system-ui,sans-serif">${subText}</text>` +
      `<text x="${x + 6}" y="${y + 16}" font-size="14" fill="${textColor}" opacity="0.7" ` +
      `font-family="Inter,system-ui,sans-serif">${d.ti}</text>` +
      `</g>`;
  });

  // Legend: 5 swatches + a "no data" swatch, with band labels.
  const bands = [
    { c: VIRIDIS_5[0], l: '<50%' },
    { c: VIRIDIS_5[1], l: '50-64%' },
    { c: VIRIDIS_5[2], l: '65-79%' },
    { c: VIRIDIS_5[3], l: '80-89%' },
    { c: VIRIDIS_5[4], l: '≥90%' },
    { c: NO_DATA_COLOR, l: 'no data' },
  ];
  const legend = bands.map(b =>
    `<span style="display:inline-flex;align-items:center;gap:3px;font-size:9px;color:#64748b">` +
    `<span style="width:10px;height:10px;background:${b.c};border-radius:2px;border:1px solid #cbd5e1"></span>${b.l}</span>`
  ).join('');

  return (
    `<div class="card" style="padding:14px;margin-bottom:10px">` +
    `<div style="display:flex;align-items:baseline;gap:8px;margin-bottom:6px">` +
    `<div style="font-size:12px;font-weight:700">🗺️ Topic Heatmap (FSRS retention)</div>` +
    `<div style="font-size:9px;color:#94a3b8">${subtitle}</div>` +
    `</div>` +
    `<svg viewBox="0 0 ${W} ${H}" width="100%" preserveAspectRatio="xMidYMid meet" ` +
    `role="img" aria-label="Topic mastery heatmap" style="display:block">` +
    cells +
    `</svg>` +
    `<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:8px">` +
    legend +
    `</div>` +
    `</div>`
  );
}
