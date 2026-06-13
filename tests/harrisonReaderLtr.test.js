import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

// Regression guard for v1.25.7 — Harrison in-app reader renders English chapter prose/titles
// LTR, not inheriting RTL from <html dir=rtl>. Port of Pnimit #150. The other three readers
// (Goroll/Nelson PDF launchers, Lerner) were already correct.
const lib = readFileSync('src/ui/library-view.js', 'utf8');

describe('Harrison reader LTR (v1.25.7, port of Pnimit #150)', () => {
  it('chapter title carries dir=auto + unicode-bidi:plaintext', () => {
    expect(lib).toMatch(/<div dir="auto"[^>]*white-space:nowrap;unicode-bidi:plaintext">Ch \$\{G\.harChOpen\}/);
  });
  it('reader ships NO verbatim Harrison prose — grounded server-side (copyright)', () => {
    expect(lib).not.toMatch(/ede9fe;unicode-bidi:plaintext">\$\{sec\.title\}/);
    expect(lib).not.toMatch(/<p dir="auto"[^>]*unicode-bidi:plaintext">\$\{p\}/);
    expect(lib).not.toMatch(/\.sections\s*\.\s*forEach/);
  });
});
