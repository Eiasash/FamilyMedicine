/**
 * Tests for the source-link module (src/ui/source-link.js).
 *
 * Covers:
 *   - parseRef detection across all 6 source types (goroll/nelson/lerner/harrison/afp/hari)
 *   - chapter number extraction (Ch N, §N, sec N variants)
 *   - renderSourceLink output (linkable vs external)
 *   - openSource navigation side effects on G.tab + G.libSec
 *   - sanitization of ref text in rendered output
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import G from '../src/core/globals.js';
import {
  parseRef,
  renderSourceLink,
  isLinkable,
  openSource,
} from '../src/ui/source-link.js';

beforeEach(() => {
  G.tab = 'quiz';
  G.libSec = 'goroll';
  G.harChOpen = null;
  G.lerChOpen = null;
  G.nelSearch = '';
  G.afpSearch = '';
  G.render = vi.fn();
});

// ---- parseRef --------------------------------------------------------------

describe('parseRef — empty / nullish input', () => {
  it('returns inert object for empty string', () => {
    const p = parseRef('');
    expect(p.src).toBeNull();
    expect(p.linkable).toBe(false);
    expect(p.raw).toBe('');
  });
  it('returns inert object for null/undefined', () => {
    expect(parseRef(null).src).toBeNull();
    expect(parseRef(undefined).src).toBeNull();
  });
});

describe('parseRef — Goroll', () => {
  it('detects "Goroll 8e Ch 19"', () => {
    const p = parseRef('Goroll 8e Ch 19');
    expect(p.src).toBe('goroll');
    expect(p.label).toBe('Goroll 8e');
    expect(p.libSec).toBe('goroll');
    expect(p.ch).toBe(19);
    expect(p.linkable).toBe(true);
  });
  it('detects with em-dash subtitle', () => {
    const p = parseRef('Goroll 8e Ch 102 — Diabetes Mellitus');
    expect(p.src).toBe('goroll');
    expect(p.ch).toBe(102);
  });
  it('handles "Ch.119" (no space)', () => {
    const p = parseRef('Goroll 8e Ch.119');
    expect(p.ch).toBe(119);
  });
});

describe('parseRef — Nelson', () => {
  it('detects "Nelson 22e Ch 185"', () => {
    const p = parseRef('Nelson 22e Ch 185 — Childhood Asthma');
    expect(p.src).toBe('nelson');
    expect(p.ch).toBe(185);
    expect(p.linkable).toBe(true);
  });
});

describe('parseRef — Lerner', () => {
  it('detects "Lerner 2025 §47"', () => {
    const p = parseRef('Lerner 2025 §47 — סוכרת');
    expect(p.src).toBe('lerner');
    expect(p.ch).toBe(47);
    expect(p.linkable).toBe(true);
  });
  it('detects "Lerner 2025 sec 12"', () => {
    const p = parseRef('Lerner 2025 sec 12');
    expect(p.ch).toBe(12);
  });
  it('detects "Lerner 2025 ch 5"', () => {
    const p = parseRef('Lerner 2025 ch 5');
    expect(p.ch).toBe(5);
  });
});

describe('parseRef — Harrison', () => {
  it('detects "Harrison 22e Ch 350"', () => {
    const p = parseRef('Harrison 22e Ch 350');
    expect(p.src).toBe('harrison');
    expect(p.ch).toBe(350);
    expect(p.linkable).toBe(true);
  });
});

describe('parseRef — AFP', () => {
  it('detects "AFP 2023 — Knee OA"', () => {
    const p = parseRef('AFP 2023 — Knee OA');
    expect(p.src).toBe('afp');
    expect(p.ch).toBeNull(); // AFP refs have no chapter number
    expect(p.linkable).toBe(true);
  });
  it('detects "AFP — AOM Guidance 2019"', () => {
    const p = parseRef('AFP — AOM Guidance 2019');
    expect(p.src).toBe('afp');
  });
});

describe('parseRef — HARI / external', () => {
  it('detects HARI and marks non-linkable', () => {
    const p = parseRef('HARI 2023 — IL HTN guideline');
    expect(p.src).toBe('hari');
    expect(p.linkable).toBe(false);
  });
  it('detects Hebrew הר"י', () => {
    const p = parseRef('הר"י 2024 — pneumococcal vaccine');
    expect(p.src).toBe('hari');
    expect(p.linkable).toBe(false);
  });
  it('falls through to external for unknown sources', () => {
    const p = parseRef('UpToDate 2024 — random topic');
    expect(p.src).toBe('external');
    expect(p.linkable).toBe(false);
  });
  it('falls through to external for plain strings', () => {
    const p = parseRef('see chapter 5 of some book');
    expect(p.src).toBe('external');
    expect(p.linkable).toBe(false);
  });
});

// ---- isLinkable -----------------------------------------------------------

describe('isLinkable', () => {
  it('returns true for known linkable sources', () => {
    expect(isLinkable('Goroll 8e Ch 1')).toBe(true);
    expect(isLinkable('Nelson 22e Ch 100')).toBe(true);
    expect(isLinkable('AFP 2023 — Asthma')).toBe(true);
    expect(isLinkable('Lerner 2025 §40')).toBe(true);
    expect(isLinkable('Harrison 22e Ch 50')).toBe(true);
  });
  it('returns false for HARI / external / empty', () => {
    expect(isLinkable('HARI 2023')).toBe(false);
    expect(isLinkable('UpToDate 2024')).toBe(false);
    expect(isLinkable('')).toBe(false);
    expect(isLinkable(null)).toBe(false);
  });
});

// ---- renderSourceLink ----------------------------------------------------

describe('renderSourceLink', () => {
  it('returns empty string for empty ref', () => {
    expect(renderSourceLink('')).toBe('');
    expect(renderSourceLink(null)).toBe('');
  });

  it('renders Goroll as a clickable link with data-action', () => {
    const html = renderSourceLink('Goroll 8e Ch 19');
    expect(html).toContain('data-action="open-source"');
    expect(html).toContain('data-src="goroll"');
    expect(html).toContain('data-ch="19"');
    expect(html).toContain('Goroll 8e Ch 19');
    expect(html).toContain('cursor:pointer');
  });

  it('renders HARI as non-clickable plain text + external icon', () => {
    const html = renderSourceLink('HARI 2023 — IL HTN');
    expect(html).not.toContain('data-action="open-source"');
    expect(html).toContain('🔗');
    expect(html).toContain('cursor:default');
  });

  it('renders unknown sources as external (non-link)', () => {
    const html = renderSourceLink('UpToDate 2024');
    expect(html).not.toContain('data-action="open-source"');
    expect(html).toContain('🔗');
  });

  it('sanitizes ref text to prevent XSS', () => {
    const html = renderSourceLink('Goroll 8e Ch 1 <script>alert(1)</script>');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('omits data-ch when source has no chapter (AFP)', () => {
    const html = renderSourceLink('AFP 2023 — Knee OA');
    expect(html).not.toContain('data-ch=');
    expect(html).toContain('data-src="afp"');
  });
});

// ---- openSource ----------------------------------------------------------

describe('openSource', () => {
  it('routes Goroll to lib tab + goroll section', async () => {
    await openSource('goroll', 19, 'Goroll 8e Ch 19');
    expect(G.tab).toBe('lib');
    expect(G.libSec).toBe('goroll');
    expect(G.render).toHaveBeenCalled();
  });

  it('routes Nelson and seeds search box with chapter number', async () => {
    await openSource('nelson', 185, 'Nelson 22e Ch 185');
    expect(G.tab).toBe('lib');
    expect(G.libSec).toBe('nelson');
    expect(G.nelSearch).toBe('185');
  });

  it('routes Harrison and opens chapter via G.harChOpen', async () => {
    await openSource('harrison', 350, 'Harrison 22e Ch 350');
    expect(G.libSec).toBe('harrison');
    expect(G.harChOpen).toBe(350);
  });

  it('routes Lerner and opens section via G.lerChOpen when data is loaded', async () => {
    G._lerData = { chapters: new Array(100).fill(null).map((_, i) => ({ title: `s${i}` })) };
    await openSource('lerner', 47, 'Lerner 2025 §47');
    expect(G.libSec).toBe('lerner');
    expect(G.lerChOpen).toBe(46); // 1-based ref → 0-based array
  });

  it('routes Lerner without opening chapter when data not loaded yet', async () => {
    G._lerData = null;
    G.lerChOpen = null;
    await openSource('lerner', 47, 'Lerner 2025 §47');
    expect(G.libSec).toBe('lerner');
    expect(G.lerChOpen).toBeNull();
  });

  it('routes AFP to afphari section + sets afpSearch', async () => {
    await openSource('afp', null, 'AFP 2023 — Knee OA');
    expect(G.libSec).toBe('afphari');
    expect(G.afpSearch).toBe('2023 — Knee OA');
  });

  it('is a no-op for unknown source values', async () => {
    G.tab = 'quiz';
    G.libSec = 'goroll';
    await openSource('mystery', 5, 'whatever');
    expect(G.tab).toBe('quiz');
    expect(G.libSec).toBe('goroll');
  });

  it('does not throw when G.render is missing', async () => {
    G.render = null;
    await expect(openSource('goroll', 1, 'Goroll 8e Ch 1')).resolves.not.toThrow();
  });
});
