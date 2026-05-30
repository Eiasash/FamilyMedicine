import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

// Regression guard for the v1.25.4 header restructure.
// The old bug: .dm-btn icons were position:absolute right:Npx top:50%, which in the
// RTL header overlapped the title / version / date. (Geri shipped that bug 3x because
// nothing guarded it.) These tests fail if the header reverts to absolute positioning.
const html = readFileSync('mishpacha-mega.html', 'utf8');
const css = readFileSync('src/styles/layout.css', 'utf8');

// the full header window, up to the main content div that follows it
const HDR = (html.match(/<div class="hdr"[\s\S]*?<div class="ct"/) || [html])[0];
// the base .dm-btn rule body (not :hover/:active)
const dmBtnRule = (css.match(/\.dm-btn\s*\{[^}]+\}/) || [''])[0];

describe('header layout — flex, no absolute-icon overlap (v1.25.4 regression guard)', () => {
  it('.dm-btn base rule is NOT absolutely positioned', () => {
    expect(dmBtnRule).toBeTruthy();
    expect(dmBtnRule).not.toContain('position: absolute');
    expect(dmBtnRule).toContain('position: static');
  });

  it('header uses flex containers .hdr-bar + .dm-row', () => {
    expect(css).toMatch(/\.hdr-bar\s*\{[^}]*display:\s*flex/);
    expect(css).toMatch(/\.dm-row\s*\{[^}]*display:\s*flex/);
    expect(HDR).toContain('class="hdr-bar"');
    expect(HDR).toContain('class="dm-row"');
  });

  it('no header .dm-btn carries an inline right:Npx absolute offset (the old overlap mechanism)', () => {
    expect(HDR).not.toMatch(/<button class="dm-btn"[^>]*style="[^"]*\bright:\s*\d+px/);
  });

  it('all header action buttons live inside .dm-row', () => {
    const dmRow = (HDR.match(/<div class="dm-row">[\s\S]*?<\/div>/) || [''])[0];
    expect(dmRow).toContain('data-action="toggle-dark"');
    expect(dmRow).toContain('data-action="open-settings"');
    expect(dmRow).toContain('data-action="show-help"');
    expect(dmRow).toContain('data-action="goto-account"');
  });

  it('version stamp (#headerVer) keeps slate-300 contrast on the dark header', () => {
    const m = HDR.match(/<span id="headerVer"[^>]*>/);
    expect(m).toBeTruthy();
    expect(m[0]).toContain('color:#cbd5e1');
  });
});
