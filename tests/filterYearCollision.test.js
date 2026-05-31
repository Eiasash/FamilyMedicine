import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

// Regression guard for v1.25.8 — the #ct delegation collision: both the library year
// calendar and the quiz year pills emitted data-action="filter-year" onto the same #ct
// container, so a quiz year-pill click ran library's handler first (G.filt=undefined +
// wasted render) and self-corrected only because initQuizEvents binds last. Library's
// action was renamed to goto-quiz-year (distinct: jump-to-quiz-filtered-by-year).
// Port of Pnimit #152.
const quiz = readFileSync('src/ui/quiz-view.js', 'utf8');
const lib = readFileSync('src/ui/library-view.js', 'utf8');

describe('filter-year #ct collision fixed (v1.25.8, port of Pnimit #152)', () => {
  it('library-view owns goto-quiz-year and no longer references filter-year', () => {
    expect(lib).toContain('data-action="goto-quiz-year"');
    expect(lib).toContain("action === 'goto-quiz-year'");
    expect(lib).not.toMatch(/filter-year/); // zero filter-year refs in library-view → no #ct collision
  });
  it('quiz-view still owns filter-year (the year-pill multi-select)', () => {
    expect(quiz).toMatch(/data-action="filter-year"/);
    expect(quiz).toMatch(/action === 'filter-year'/);
  });
});
