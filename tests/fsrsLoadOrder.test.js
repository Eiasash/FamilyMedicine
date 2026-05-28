/**
 * Load-order guard for shared/fsrs.js.
 *
 * shared/fsrs.js is a CLASSIC script that sets window.FSRS_* / window.fsrs*
 * globals. src/sr/fsrs-bridge.js captures those globals at ES-module-eval
 * time and re-exports them; consumers (srScore, heatmap, learn/track/quiz
 * views) call them during app.js boot and on every answer check.
 *
 * THE TRAP: Vite hoists the app.js `<script type="module">` entry into
 * <head>. Module scripts are deferred. If fsrs.js is ALSO deferred, both run
 * after parse in DOCUMENT ORDER — and the hoisted-to-head module then runs
 * BEFORE the in-body fsrs.js, so the bridge captures `undefined` and the app
 * throws "X is not a function" on boot and on check (the v1.21.x regression).
 *
 * The only correct config is a BLOCKING (non-defer, non-async) fsrs.js, which
 * executes during parse — before the deferred module. This test fails if
 * anyone re-adds defer/async "for Lighthouse" without understanding the race.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '..');
const html = readFileSync(resolve(ROOT, 'mishpacha-mega.html'), 'utf-8');

describe('shared/fsrs.js load order (window-global → bridge race)', () => {
  it('loads fsrs.js as a blocking classic script (no defer / no async)', () => {
    const m = html.match(/<script\s+[^>]*src=["']shared\/fsrs\.js["'][^>]*><\/script>/);
    expect(m, 'fsrs.js <script> tag must exist in mishpacha-mega.html').toBeTruthy();
    const tag = m[0];
    expect(tag, `fsrs.js must NOT be deferred — Vite hoists the module entry to <head>, so a deferred fsrs.js runs AFTER it and the bridge captures undefined globals. Tag was: ${tag}`).not.toMatch(/\bdefer\b/);
    expect(tag, `fsrs.js must NOT be async (same race). Tag was: ${tag}`).not.toMatch(/\basync\b/);
    expect(tag, 'fsrs.js must not be type=module (it window-attaches; Geriatrics loads it as a classic script too)').not.toMatch(/type=["']module["']/);
  });

  it('fsrs.js script appears before the app.js module entry in source order', () => {
    const fsrsIdx = html.search(/<script\s+[^>]*src=["']shared\/fsrs\.js["']/);
    const appIdx = html.search(/<script\s+[^>]*type=["']module["'][^>]*src=["'][^"']*app\.js["']/);
    expect(fsrsIdx, 'fsrs.js tag not found').toBeGreaterThan(-1);
    expect(appIdx, 'app.js module entry not found').toBeGreaterThan(-1);
    expect(fsrsIdx).toBeLessThan(appIdx);
  });
});
