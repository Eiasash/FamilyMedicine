import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const quizViewJs = readFileSync(
  fileURLToPath(new URL('../src/ui/quiz-view.js', import.meta.url)),
  'utf8',
);
const appJs = readFileSync(
  fileURLToPath(new URL('../src/ui/app.js', import.meta.url)),
  'utf8',
);
const settingsOverlayJs = readFileSync(
  fileURLToPath(new URL('../src/ui/settings-overlay.js', import.meta.url)),
  'utf8',
);
const trackViewJs = readFileSync(
  fileURLToPath(new URL('../src/ui/track-view.js', import.meta.url)),
  'utf8',
);
const quizViewCss = readFileSync(
  fileURLToPath(new URL('../src/ui/quiz-view.css', import.meta.url)),
  'utf8',
);
const baseCss = readFileSync(
  fileURLToPath(new URL('../src/styles/base.css', import.meta.url)),
  'utf8',
);
const layoutCss = readFileSync(
  fileURLToPath(new URL('../src/styles/layout.css', import.meta.url)),
  'utf8',
);

describe('Study/Track IA regression guards', () => {
  it('keeps core exam mode launch buttons visible in Quiz', () => {
    expect(quizViewJs).toMatch(/data-action="start-exam"[^>]*>/);
    expect(quizViewJs).toMatch(/data-action="start-mock"[^>]*>/);
  });

  it('keeps retired mode launch buttons out of visible quiz controls', () => {
    expect(quizViewJs).not.toMatch(/data-action="start-sd"[^>]*>/);
    expect(quizViewJs).not.toMatch(/data-action="start-oncall"[^>]*>/);
    expect(quizViewJs).not.toMatch(/data-action="start-pomo"[^>]*>/);
  });

  it('keeps utility actions in Settings About', () => {
    expect(settingsOverlayJs).toContain('data-action="settings-share-app"');
    expect(settingsOverlayJs).toContain('data-action="settings-force-update"');
    expect(settingsOverlayJs).toMatch(/class="btn[^"]*" data-action="settings-share-app"/);
    expect(settingsOverlayJs).toMatch(/class="btn[^"]*" data-action="settings-force-update"/);
    expect(settingsOverlayJs).toContain('InternalMedicine');
    expect(settingsOverlayJs).toContain('Geriatrics');
  });

  it('uses class-driven Study and More segmented controls', () => {
    expect(appJs).toContain('class="subtabs"');
    expect(appJs).toContain('class="subtab-btn ');
    expect(appJs).not.toMatch(/data-action="lib-sub"[^>]+style="/);
    expect(appJs).not.toMatch(/data-action="more-sub"[^>]+style="/);
  });

  it('keeps Study Plan row actions on the shared compact button surface', () => {
    expect(trackViewJs).toContain('class="sp-actions"');
    expect(trackViewJs).toContain('class="sp-action sp-action--chapter"');
    expect(trackViewJs).toContain('class="sp-action sp-action--notes"');
    expect(trackViewJs).toContain('class="sp-action sp-action--quiz"');
    expect(trackViewJs).toContain('class="sp-action sp-action--ai"');
    expect(trackViewJs).toContain('class="syl-toggle-btn"');
    expect(trackViewJs).not.toMatch(/data-action="sp-(open-chapter|open-notes|quiz|summarize)"[^>]+style="/);
  });

  it('pins the mobile RTL overflow clamp for the fixed tab bar', () => {
    expect(baseCss).toMatch(/html\s*\{\s*overflow-x:\s*hidden\s*\}/);
    expect(layoutCss).toMatch(/\.tabs\s*\{[^}]*right:\s*auto;[^}]*width:\s*100%/s);
    expect(layoutCss).toMatch(/\.tabs button\s*\{[^}]*flex:\s*1 1 0;[^}]*min-height:\s*56px/s);
    expect(quizViewCss).toMatch(/margin-inline:\s*0;/);
  });
});
