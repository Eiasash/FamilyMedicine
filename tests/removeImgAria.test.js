import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

const quiz = readFileSync('src/ui/quiz-view.js', 'utf8');

describe('remove-img a11y', () => {
  it('every remove-img button has an accessible name', () => {
    const buttons = quiz.match(/<button[^>]*data-action="remove-img"[^>]*>/g) || [];
    expect(buttons.length).toBeGreaterThanOrEqual(1);
    for (const b of buttons) expect(b).toMatch(/aria-label=/);
  });
});
