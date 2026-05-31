import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

// Regression guards for the v1.25.6 dark-mode P1 fix (2026-05-31 suite-wide audit).
// The inverse dark-on-dark bug: reader prose / study notes / flashcard fronts / section
// headings hardcode a dark inline color (#1e293b/#0f172a/#334155) that collides 1:1 with
// the dark .card/.fc/body background → invisible. theme.css rescues them; :not([background])
// skips light-islands (code blocks, note editors) that carry their own bg.
const theme = readFileSync('src/styles/theme.css', 'utf8');
const moreView = readFileSync('src/ui/more-view.js', 'utf8');
const trackView = readFileSync('src/ui/track-view.js', 'utf8');
const quizView = readFileSync('src/ui/quiz-view.js', 'utf8');

describe('dark-mode inverse dark-on-dark fix (v1.25.6 audit P1)', () => {
  it('rescues hardcoded dark inline prose colors in dark + study mode, skipping islands', () => {
    for (const hex of ['1e293b', '0f172a', '334155']) {
      expect(theme).toMatch(
        new RegExp(`body\\.dark \\[style\\*=";color:#${hex}"\\]:not\\(\\[style\\*="background"\\]\\)`)
      );
      expect(theme).toMatch(
        new RegExp(`body\\.study \\[style\\*=";color:#${hex}"\\]:not\\(\\[style\\*="background"\\]\\)`)
      );
    }
    // the :not([background]) island-guard must be present so code blocks / note editors stay legible
    expect(theme).toContain(':not([style*="background"])');
  });

  it('darkens the named light-island surfaces in dark mode', () => {
    for (const sel of ['#gnotes-ta', '.gnotes-panel', '.qnote-card', '.due-alert', '.chat-msg-err', '.daily-contract']) {
      expect(theme).toContain('body.dark ' + sel);
    }
  });

  it('wires the light-island class hooks in the view templates', () => {
    expect(moreView).toContain('class="gnotes-panel"');
    expect(moreView).toContain('class="qnote-card"');
    expect(trackView).toContain('class="card due-alert"');
    expect(quizView).toContain('class="daily-contract"');
  });
});
