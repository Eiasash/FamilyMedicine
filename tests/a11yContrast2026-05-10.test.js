/**
 * Accessibility regression guards for the v1.21.20 contrast port from
 * Geriatrics v10.64.82-87 a11y campaign.
 *
 * Live playwright re-audit on v1.21.19 found 5 actionable contrast violations
 * (gradient-blindspot false positives on h1+dm-btns excluded). Each test
 * below pins one of the six fixes shipped in v1.21.20.
 *
 * If any of these regresses, the suite fails before the regression reaches
 * users. Pattern + structure mirror Geri's tests/a11yIssue125.test.js.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

let html = '';
let utilitiesCss = '';
let layoutCss = '';
let quizViewCss = '';

beforeAll(() => {
  const root = resolve(import.meta.dirname, '..');
  html = readFileSync(resolve(root, 'mishpacha-mega.html'), 'utf-8');
  utilitiesCss = readFileSync(resolve(root, 'src/styles/utilities.css'), 'utf-8');
  layoutCss = readFileSync(resolve(root, 'src/styles/layout.css'), 'utf-8');
  quizViewCss = readFileSync(resolve(root, 'src/ui/quiz-view.css'), 'utf-8');
});

describe('a11y v1.21.20 — html dir="rtl"', () => {
  it('document root has explicit dir="rtl" (was lang="he" without dir)', () => {
    // Hebrew RTL screen-reader anchor — same fix as Geri v10.64.82.
    expect(html).toMatch(/<html[^>]*lang="he"[^>]*dir="rtl"/);
  });
});

describe('a11y v1.21.20 — skip-link contrast', () => {
  it('skip-link bg is #2563eb (4.78:1, AA), not #3b82f6 (3.68:1)', () => {
    const m = utilitiesCss.match(/\.skip-link\s*\{[^}]+\}/);
    expect(m).toBeTruthy();
    expect(m[0]).toContain('background: #2563eb');
    expect(m[0]).not.toContain('background: #3b82f6');
  });
});

describe('a11y v1.21.20 — header subtitle "Family Medicine"', () => {
  it('inline color is #92400e (amber-800, 7.14:1 on #fffbeb), not #d97706 (3.07:1)', () => {
    const headerLine = html.split('\n').find(line => line.includes('Family Medicine</span>'));
    expect(headerLine).toBeTruthy();
    expect(headerLine).toContain('color:#92400e');
    expect(headerLine).not.toContain('color:#d97706');
  });

  it('headerVer date span uses slate-300 (#cbd5e1) on dark gradient, not slate-500 (#64748b)', () => {
    // The .hdr is a dark slate gradient. slate-500 (#64748b) on dark = ~2.99:1.
    // slate-300 (#cbd5e1) on dark = ~6.13:1, strong AA pass.
    const headerVerMatch = html.match(/<span id="headerVer"[^>]*>/);
    expect(headerVerMatch).toBeTruthy();
    expect(headerVerMatch[0]).toContain('color:#cbd5e1');
    expect(headerVerMatch[0]).not.toContain('color:#64748b');
  });
});

describe('a11y v1.21.20 — selected-tab .tabs button.on (mishpacha skin)', () => {
  it('mishpacha-skin scoped override uses #92400e (amber-800, 6.59:1), preserves --app-primary in dark mode', () => {
    // mishpacha skin's --app-primary is #d97706 (amber-600) which is 3.13:1
    // on white tabs bar. Scoped override fixes light mode without changing
    // the variable (background usages of --app-primary still work).
    expect(layoutCss).toMatch(/html\[data-skin="mishpacha"\]\s+\.tabs button\.on\s*\{\s*color:\s*#92400e\s*\}/);
    expect(layoutCss).toMatch(/body\.dark\[data-skin="mishpacha"\]\s+\.tabs button\.on[^{]*\{\s*color:\s*var\(--app-primary\)\s*\}/);
  });

  it('base .tabs button.on rule is unchanged (still uses --app-primary for non-mishpacha skins)', () => {
    // Pnimit (sky/emerald) and Toranot (slate) skins already pass on white;
    // the override is mishpacha-only.
    expect(layoutCss).toMatch(/^\.tabs button\.on\s*\{\s*color:\s*var\(--app-primary\)\s*\}/m);
  });
});

describe('a11y v1.21.20 — .quiz-controls__label', () => {
  it('uses --color-fg-muted (#5b5a52, 6.49:1 AAA), not --color-fg-subtle (#8d8b80, 3.27:1)', () => {
    // The subtle token is reserved for decorative text only. Functional
    // labels need at least muted (--color-fg-muted) for AA on the page bg.
    const ruleMatch = quizViewCss.match(/\.quiz-controls__label\s*\{[^}]+\}/);
    expect(ruleMatch).toBeTruthy();
    expect(ruleMatch[0]).toContain('color: var(--color-fg-muted)');
    expect(ruleMatch[0]).not.toContain('color: var(--color-fg-subtle)');
  });
});

describe('a11y v1.21.21 — residual contrast clears', () => {
  it('.hdr p uses slate-300 (#cbd5e1) for the dark gradient bg, not slate-500 (#64748b)', () => {
    // The .hdr clock/subtitle was rendering slate-500 on dark slate gradient
    // at 3.75:1. slate-300 hits ~12:1 (AAA) on the same surface.
    expect(layoutCss).toMatch(/\.hdr p \{[^}]*color: #cbd5e1/);
    expect(layoutCss).not.toMatch(/\.hdr p \{[^}]*color: #64748b/);
  });

  it('.tabs button:not(.on) uses slate-500 (#64748b, 4.65:1 AA), not slate-400 (#94a3b8, 2.69:1)', () => {
    // Inactive bottom-tab labels (📖 Library, 🩺 Track, etc.) were failing AA.
    expect(layoutCss).toMatch(/\.tabs button:not\(\.on\) \{[^}]*color: #64748b/);
    expect(layoutCss).not.toMatch(/\.tabs button:not\(\.on\) \{[^}]*color: #94a3b8/);
  });

  it('.quiz-meta__counter uses --color-fg-muted (6.49:1 AAA), not --color-fg-subtle (3.27:1)', () => {
    // Same pattern as the v1.21.20 .quiz-controls__label fix. The counter
    // ("1 / 1139") is functional UI text, not decorative.
    const ruleMatch = quizViewCss.match(/\.quiz-meta__counter\s*\{[^}]+\}/);
    expect(ruleMatch).toBeTruthy();
    expect(ruleMatch[0]).toContain('color: var(--color-fg-muted)');
    expect(ruleMatch[0]).not.toContain('color: var(--color-fg-subtle)');
  });
});

describe('a11y v1.21.26 — skip-link mobile out-of-bounds guard', () => {
  // Browser-tested 2026-05-10: legacy `.skip-link { left:-9999px }` inflated
  // documentElement.scrollWidth to 10385px on 390-wide mobile viewports.
  // Body had overflow-x:hidden but <html> had overflow-x:visible, so the
  // phantom width affected Lighthouse, pinch-zoom math, and JS reading
  // scrollWidth. Fix replaces off-screen pattern with WCAG canonical
  // clip-rect visually-hidden pattern. These guards prevent drive-by
  // reintroduction. Sibling-aligned with Geri tests/a11yIssue125.test.js
  // + IM tests/a11yContrast2026-05-10.test.js.

  it('.skip-link rule does NOT use left:-9999 (or other large negative)', () => {
    const m = utilitiesCss.match(/\.skip-link\s*\{[^}]+\}/);
    expect(m, '.skip-link CSS rule must exist').not.toBeNull();
    expect(m[0]).not.toMatch(/left:\s*-\d{3,}/);
  });

  it('.skip-link rule uses the visually-hidden clip pattern', () => {
    const m = utilitiesCss.match(/\.skip-link\s*\{[^}]+\}/);
    expect(m).not.toBeNull();
    expect(m[0]).toMatch(/clip:\s*rect\(\s*0(?:px)?\s*,\s*0(?:px)?\s*,\s*0(?:px)?\s*,\s*0(?:px)?\s*\)/);
  });

  it('.skip-link:focus restores width/height for visible focus state', () => {
    const m = utilitiesCss.match(/\.skip-link:focus\s*\{[^}]+\}/);
    expect(m, '.skip-link:focus rule must exist').not.toBeNull();
    expect(m[0]).toMatch(/width:\s*auto/);
    expect(m[0]).toMatch(/height:\s*auto/);
    expect(m[0]).toMatch(/clip:\s*auto/);
  });
});
