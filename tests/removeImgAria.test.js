import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

// Regression guard for v1.25.9 — the icon-only destructive remove-image (✕) button must
// carry an accessible name. The main quiz path (:522) was already labeled; the
// Sudden-Death render path (:402) was missing aria-label/title. Port of Pnimit #149.
const quiz = readFileSync('src/ui/quiz-view.js', 'utf8');

describe('remove-img a11y (v1.25.9, port of Pnimit #149)', () => {
  it('every remove-img button has an accessible name (aria-label)', () => {
    const buttons = quiz.match(/<button[^>]*data-action="remove-img"[^>]*>/g) || [];
    expect(buttons.length).toBeGreaterThanOrEqual(2); // main + Sudden-Death render paths
    for (const b of buttons) expect(b).toMatch(/aria-label=/);
  });
});
