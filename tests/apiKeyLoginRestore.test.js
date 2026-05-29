/**
 * Tests for FM v1.21.12 → v1.21.14 api-key cloud sync flow + the v1.21.13 P0
 * crash fixes (sibling-paired with IM v10.4.14-17 / Geri v10.64.48-50).
 *
 * v1.21.12 — _apikey in cloudBackup payload
 * v1.21.13 — P0 crashes:
 *            (a) toLowerCase undefined defensive (4,890 chaos crashes)
 *            (b) flashcards 'f' undefined bounds-check (245 crashes)
 *            (c) startTimedQ G-binding (sibling-shared with IM)
 * v1.21.14 — _handleLogin reads r.api_key from auth_login_user response
 *
 * These are the most chaos-tested fixes in the FM repo. CI guard against
 * regression is high-value — the previous form silently crashed the page
 * for users with one bad data record.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const rootDir = resolve(import.meta.dirname, '..');
const cloudJs = readFileSync(resolve(rootDir, 'src/features/cloud.js'), 'utf-8');
const authJs = readFileSync(resolve(rootDir, 'src/features/auth.js'), 'utf-8');
const utilsJs = readFileSync(resolve(rootDir, 'src/core/utils.js'), 'utf-8');
const engineJs = readFileSync(resolve(rootDir, 'src/quiz/engine.js'), 'utf-8');
const appJs = readFileSync(resolve(rootDir, 'src/ui/app.js'), 'utf-8');

describe('FM v1.21.12 — _apikey in cloudBackup payload', () => {
  it('cloud.js imports getApiKey + setApiKey from utils', () => {
    expect(cloudJs).toMatch(/import\s+\{[^}]*getApiKey[^}]*\}\s+from\s+['"]\.\.\/core\/utils\.js['"]/);
    expect(cloudJs).toMatch(/import\s+\{[^}]*setApiKey[^}]*\}\s+from\s+['"]\.\.\/core\/utils\.js['"]/);
  });

  it('cloudBackup bundle includes _apikey', () => {
    expect(cloudJs).toMatch(/_apikey\s*=\s*getApiKey\(\)/);
  });

  it('applyRestorePayload restores rowData._apikey via setApiKey', () => {
    expect(cloudJs).toContain('rowData._apikey');
    expect(cloudJs).toContain('setApiKey');
  });
});

describe('FM v1.21.13 P0 (a) — toLowerCase undefined defensive (4,890 chaos crashes)', () => {
  // Original chaos run finding: 4,890 `'toLowerCase' of undefined` pageerrors
  // across 7 hours. One bad data record (missing topic/name/option) poisoned
  // every keystroke.
  it('more-view.js search uses (field||\'\').toLowerCase() pattern', () => {
    const moreView = readFileSync(resolve(rootDir, 'src/ui/more-view.js'), 'utf-8');
    expect(moreView).toMatch(/\(item\.q\|\|''\)\.toLowerCase\(\)/);
    expect(moreView).toMatch(/\(n\.topic\|\|''\)\.toLowerCase\(\)/);
    // Drug search removed from global Search (v1.23.0 — Drugs tab retired); the
    // defensive d.name guard now lives only in learn-view.js (asserted below).
  });

  it('learn-view.js notes filter uses (field||\'\').toLowerCase()', () => {
    const learnView = readFileSync(resolve(rootDir, 'src/ui/learn-view.js'), 'utf-8');
    expect(learnView).toMatch(/\(n\.topic\|\|''\)\.toLowerCase\(\)/);
    expect(learnView).toMatch(/\(n\.notes\|\|''\)\.toLowerCase\(\)/);
  });

  it('learn-view.js drug filter uses (field||\'\').toLowerCase()', () => {
    const learnView = readFileSync(resolve(rootDir, 'src/ui/learn-view.js'), 'utf-8');
    expect(learnView).toMatch(/\(d\.name\|\|''\)\.toLowerCase\(\)/);
  });
});

describe('FM v1.21.13 P0 (b) — flashcards \'f\' undefined bounds-check (245 chaos crashes)', () => {
  it('learn-view.js flashcard render bails early when G.FLASH is empty/missing', () => {
    const learnView = readFileSync(resolve(rootDir, 'src/ui/learn-view.js'), 'utf-8');
    // The defensive early return prevents G.S.fci % 0 = NaN → FLASH[NaN] → undef.f throw.
    expect(learnView).toMatch(/!G\.FLASH\|\|G\.FLASH\.length===0/);
    // Includes a fallback for activeIdx out-of-bounds via FLASH[0].
    expect(learnView).toMatch(/G\.FLASH\[activeIdx\]\|\|G\.FLASH\[0\]/);
  });
});

describe('FM v1.21.13 P0 (c) — startTimedQ G-binding (sibling-shared)', () => {
  it('app.js binds startTimedQ on G', () => {
    expect(appJs).toContain('G.startTimedQ = startTimedQ');
  });

  it('engine.js uses G.startTimedQ via setTimeout closure (no bare reference)', () => {
    expect(engineJs).toMatch(/setTimeout\(\(\)=>G\.startTimedQ/);
    expect(engineJs).not.toMatch(/setTimeout\(startTimedQ\b/);
  });
});

describe('FM v1.21.14 — _handleLogin restores api_key from response', () => {
  it('auth.js imports setApiKey from utils', () => {
    expect(authJs).toMatch(/import\s+\{[^}]*setApiKey[^}]*\}\s+from\s+['"]\.\.\/core\/utils\.js['"]/);
  });

  it('_handleLogin calls setApiKey(r.api_key) on success with typeof guard', () => {
    expect(authJs).toMatch(/typeof\s+r\.api_key\s*===\s*['"]string['"]/);
    expect(authJs).toContain('setApiKey(r.api_key)');
  });

  it('setApiKey runs AFTER setAuthSession (login first, then key restore)', () => {
    const sessionIdx = authJs.indexOf('setAuthSession(r.username');
    const apiKeyIdx = authJs.indexOf('setApiKey(r.api_key)');
    expect(sessionIdx).toBeGreaterThan(-1);
    expect(apiKeyIdx).toBeGreaterThan(-1);
    expect(apiKeyIdx).toBeGreaterThan(sessionIdx);
  });
});

describe('FM utils.js — sibling parity with mishpacha_apikey key', () => {
  it('utils.js exports getApiKey + setApiKey using mishpacha_apikey localStorage key', () => {
    expect(utilsJs).toMatch(/export\s+function\s+getApiKey\(\)/);
    expect(utilsJs).toMatch(/export\s+function\s+setApiKey\(/);
    expect(utilsJs).toContain('mishpacha_apikey');
  });
});
