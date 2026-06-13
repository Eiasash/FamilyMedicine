import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const activeFiles = [
  '../src/core/globals.js',
  '../src/quiz/modes.js',
  '../src/quiz/engine.js',
  '../src/ui/app.js',
  '../src/ui/quiz-view.js',
].map(p => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8')).join('\n');

describe('retired quiz mode source guard', () => {
  it('keeps Sudden Death, On-Call, and Pomodoro out of active source files', () => {
    expect(activeFiles).not.toMatch(/startSuddenDeath|endSuddenDeath|sdMode|sdPool|sdStreak|sdLeaderboard/);
    expect(activeFiles).not.toMatch(/startOnCallMode|renderOnCall|onCallMode|flipRevealed|onCallPick|runExplainOnCall/);
    expect(activeFiles).not.toMatch(/startPomodoro|stopPomodoro|pomoActive|pomoInterval|pomoSec|pomoBreak/);
  });
});
