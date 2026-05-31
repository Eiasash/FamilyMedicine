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
  it('section heading carries dir=auto + unicode-bidi:plaintext', () => {
    expect(lib).toMatch(/<div dir="auto"[^>]*ede9fe;unicode-bidi:plaintext">\$\{sec\.title\}/);
  });
  it('chapter prose carries dir=auto, text-align:start, unicode-bidi:plaintext (not justify-RTL)', () => {
    expect(lib).toMatch(/<p dir="auto"[^>]*text-align:start;unicode-bidi:plaintext">\$\{p\}/);
    // the old justify-without-dir form must be gone
    expect(lib).not.toMatch(/color:#1e293b;margin:0 0 10px;text-align:justify">\$\{p\}/);
  });
});
