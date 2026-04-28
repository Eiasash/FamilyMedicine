// Source-link rendering for question explanations.
//
// Each Q may carry a `ref` field — free-text citation like:
//   "Goroll 8e Ch 119"
//   "Goroll 8e Ch 102 — Diabetes Mellitus"
//   "Nelson 22e Ch 185 — Childhood Asthma"
//   "AFP 2023 — Knee OA"
//   "Lerner 2025 §47 — סוכרת"
//   "Harrison 22e Ch 350"
//   "HARI 2023 — IL HTN guideline"
//
// FamilyMedicine has multiple primary sources. This module:
//   1. parseRef(ref) → detects which source (goroll/nelson/afp/lerner/harrison/external/none)
//      and extracts the chapter/section number when present.
//   2. renderSourceLink(ref) → returns an HTML snippet that is either
//      a clickable link routed to the right reader, or plain text + 🔗
//      icon for sources we can't deep-link to.
//
// Routing destinations (libSec values from src/ui/library-view.js):
//   Goroll  → libSec='goroll',   action='lib-section' + scrolls to chapter
//   Nelson  → libSec='nelson',   uses search box to filter to ch number
//   Lerner  → libSec='lerner',   action='open-ler-chapter' if §N matches
//   Harrison→ libSec='harrison', action='open-chapter' + ch number
//   AFP     → libSec='afphari',  scrolls to AFP+search query
//   HARI/ext→ no link, just plain text + small 🔗 indicator

import { sanitize } from '../core/utils.js';

// Detection patterns. Order matters — Lerner must come before Goroll because
// "Lerner 2025" doesn't match Goroll's "8e" but if we ever drop the edition the
// AFP "2025" pattern shouldn't gobble Lerner.
const PATTERNS = [
  {
    src: 'goroll',
    label: 'Goroll 8e',
    libSec: 'goroll',
    re: /goroll/i,
    chRe: /Ch\.?\s*(\d+)/i,
  },
  {
    src: 'nelson',
    label: 'Nelson 22e',
    libSec: 'nelson',
    re: /nelson/i,
    chRe: /Ch\.?\s*(\d+)/i,
  },
  {
    src: 'lerner',
    label: 'Lerner 2025',
    libSec: 'lerner',
    re: /lerner/i,
    // Lerner uses §-numbered sections in some refs ("Lerner §42") and also a
    // chapter-style "ch N" in others. Either matches.
    chRe: /(?:§|sec(?:tion)?\.?\s*|ch\.?\s*)(\d+)/i,
  },
  {
    src: 'harrison',
    label: 'Harrison 22e',
    libSec: 'harrison',
    re: /harrison/i,
    chRe: /Ch\.?\s*(\d+)/i,
  },
  {
    src: 'afp',
    label: 'AFP',
    libSec: 'afphari',
    re: /\bAFP\b/i,
    chRe: null, // AFP refs don't carry numeric chapters; we use the title text
  },
  {
    src: 'hari',
    label: 'הר"י / HARI',
    libSec: null, // no in-app reader for HARI guidelines yet
    // Note: \b doesn't work with Hebrew chars in JS — match the Hebrew tokens
    // directly (with optional ASCII boundary for the latin form). The IL ministry
    // ASCII form "HARI" is bounded; the Hebrew forms use their own delimiters
    // (the gershayim ׳ / " / quote) which already make them distinct enough.
    re: /(?:\bHARI\b|הר"י|הר״י|הר׳׳י)/i,
    chRe: null,
  },
];

// Parse a ref string. Always returns an object so callers can branch off
// `.linkable`. Empty / null ref → { src:null, linkable:false, raw:'' }.
export function parseRef(ref) {
  const raw = String(ref || '').trim();
  if (!raw) return { src: null, label: '', libSec: null, ch: null, raw: '', linkable: false };
  for (const p of PATTERNS) {
    if (p.re.test(raw)) {
      let ch = null;
      if (p.chRe) {
        const m = raw.match(p.chRe);
        if (m) ch = parseInt(m[1], 10);
      }
      return {
        src: p.src,
        label: p.label,
        libSec: p.libSec,
        ch,
        raw,
        linkable: !!p.libSec, // hari is recognized but not deep-linkable
      };
    }
  }
  // Fallback: external / unknown — render with 🔗 icon, no link.
  return { src: 'external', label: 'External', libSec: null, ch: null, raw, linkable: false };
}

// Per-source brand colors (match library-view.js conventions where possible).
const COLORS = {
  goroll: { bg: '#fff7ed', fg: '#9a3412', border: '#fed7aa' },
  nelson: { bg: '#ecfdf5', fg: '#065f46', border: '#a7f3d0' },
  lerner: { bg: '#fef2f2', fg: '#991b1b', border: '#fecaca' },
  harrison: { bg: '#f5f3ff', fg: '#5b21b6', border: '#ddd6fe' },
  afp: { bg: '#eff6ff', fg: '#1d4ed8', border: '#bfdbfe' },
  hari: { bg: '#f8fafc', fg: '#475569', border: '#e2e8f0' },
  external: { bg: '#f8fafc', fg: '#64748b', border: '#e2e8f0' },
};

// Render an HTML snippet for a ref string. Always returns either a
// clickable element with data-action="open-source" or plain text with a
// small external-icon indicator. Never throws on bad input — empty ref
// returns ''.
//
// The caller wires data-action="open-source" + data-src + data-ch + data-ref
// into existing event delegation (see initSourceLinkEvents below).
export function renderSourceLink(ref) {
  const parsed = parseRef(ref);
  if (!parsed.raw) return '';
  const c = COLORS[parsed.src] || COLORS.external;
  const baseStyle =
    `display:inline-flex;align-items:center;gap:4px;` +
    `padding:3px 8px;border-radius:8px;font-size:10px;font-weight:600;` +
    `background:${c.bg};color:${c.fg};border:1px solid ${c.border};` +
    `text-decoration:none;cursor:${parsed.linkable ? 'pointer' : 'default'};` +
    `direction:ltr;unicode-bidi:isolate`;

  const safeLabel = sanitize(parsed.raw);

  if (parsed.linkable) {
    const dataCh = parsed.ch != null ? ` data-ch="${parsed.ch}"` : '';
    return (
      `<span data-action="open-source" data-src="${parsed.src}"${dataCh} ` +
      `data-ref="${safeLabel}" style="${baseStyle}" role="link" tabindex="0" ` +
      `title="Open in ${sanitize(parsed.label)} reader">` +
      `📖 ${safeLabel}</span>`
    );
  }
  // Non-linkable (HARI, external, malformed) — plain text + external icon.
  return (
    `<span style="${baseStyle}" title="External reference (no in-app reader)">` +
    `🔗 ${safeLabel}</span>`
  );
}

// Returns true if the ref string would produce a link (used for tests + UI gating).
export function isLinkable(ref) {
  return parseRef(ref).linkable;
}

// Wire ref-link clicks. Caller passes a container element (the quiz card).
// Clicking a [data-action="open-source"] element routes G to the right
// library section + opens the chapter/search where applicable.
//
// Imports done lazily inside the handler so this module stays import-cheap
// (and avoids circular deps with library-view).
export function initSourceLinkEvents(container) {
  if (!container || typeof container.addEventListener !== 'function') return;
  container.addEventListener('click', async (e) => {
    const el = e.target.closest && e.target.closest('[data-action="open-source"]');
    if (!el) return;
    e.preventDefault();
    const src = el.dataset.src;
    const chRaw = el.dataset.ch;
    const ch = chRaw != null && chRaw !== '' ? parseInt(chRaw, 10) : null;
    const ref = el.dataset.ref || '';
    await openSource(src, ch, ref);
  });
}

// Programmatic source open — exported so the engine + tests can call it.
export async function openSource(src, ch, ref) {
  // Late import to avoid circular dep (library-view imports many things).
  const G = (await import('../core/globals.js')).default;
  if (!G || typeof G.render !== 'function') return;
  switch (src) {
    case 'goroll':
      G.tab = 'lib';
      G.libSec = 'goroll';
      // Goroll uses direct PDF anchor links (no in-app reader); navigating
      // to the section is the best we can do — user taps the chapter row.
      // If we have a chapter number, open the PDF directly in a new tab.
      if (ch != null && !isNaN(ch)) {
        try {
          const data = G._gorollData;
          if (Array.isArray(data)) {
            const match = data.find((c) => Number(c.num) === ch);
            if (match && typeof window !== 'undefined' && window.open) {
              window.open(`goroll/Goroll_8e.pdf#page=${match.page}`, '_blank', 'noopener');
            }
          }
        } catch (e) { /* fall through to library tab */ }
      }
      G.render();
      return;
    case 'nelson':
      G.tab = 'lib';
      G.libSec = 'nelson';
      if (ch != null && !isNaN(ch)) G.nelSearch = String(ch);
      G.render();
      return;
    case 'lerner':
      G.tab = 'lib';
      G.libSec = 'lerner';
      // If we have a section number AND lerner data is loaded, open it.
      if (ch != null && !isNaN(ch) && G._lerData && Array.isArray(G._lerData.chapters)) {
        // Lerner sections are 0-indexed in the array but refs use 1-based numbering.
        const idx = Math.max(0, Math.min(ch - 1, G._lerData.chapters.length - 1));
        G.lerChOpen = idx;
      }
      G.render();
      return;
    case 'harrison':
      G.tab = 'lib';
      G.libSec = 'harrison';
      if (ch != null && !isNaN(ch)) {
        G.harChOpen = ch;
      }
      G.render();
      return;
    case 'afp':
      G.tab = 'lib';
      G.libSec = 'afphari';
      // Use the ref text as a search hint. afphari has its own search UI;
      // setting G.afpSearch (best-effort — UI may or may not honor it).
      if (ref) G.afpSearch = ref.replace(/^AFP\s*[—–-]?\s*/i, '').trim();
      G.render();
      return;
    default:
      // Non-linkable sources should not have triggered open-source at all.
      return;
  }
}
