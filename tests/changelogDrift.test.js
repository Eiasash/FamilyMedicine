/**
 * CHANGELOG drift regression test.
 *
 * 2026-05-06: noticed APP_VERSION='1.21.14' in src/core/constants.js but the
 * latest CHANGELOG entry was '1.21.11' — 3 missing entries (1.21.12, 1.21.13,
 * 1.21.14). Nothing actively prevented the drift.
 *
 * The version-quartet guard (APP_VERSION ↔ BUILD_HASH ↔ sw.js CACHE ↔
 * package.json) catches version-bump misalignment but does NOT check whether
 * the CURRENT version has a corresponding CHANGELOG entry. This test fills
 * that gap.
 *
 * If this fails:
 *   - Easy fix: add an entry like `'<APP_VERSION>': [` inside CHANGELOG={...}.
 *
 * Sibling-paired with Geriatrics/tests/changelogDrift.test.js and
 * InternalMedicine/tests/changelogDrift.test.js.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');
// APP_VERSION + BUILD_HASH remain in constants.js (small primitives).
// CHANGELOG was extracted to changelog.js for code-splitting — its drift
// guard now reads from there instead.
const constantsJs = readFileSync(resolve(ROOT, 'src/core/constants.js'), 'utf-8');
const changelogJs = readFileSync(resolve(ROOT, 'src/core/changelog.js'), 'utf-8');

describe('CHANGELOG drift guard', () => {
  it('APP_VERSION export is parseable from src/core/constants.js', () => {
    const m = constantsJs.match(/export\s+const\s+APP_VERSION\s*=\s*'([^']+)'/);
    expect(m, 'APP_VERSION export not found').toBeTruthy();
    expect(m[1]).toMatch(/^\d+\.\d+(\.\d+)?$/);
  });

  it('current APP_VERSION has a corresponding CHANGELOG entry', () => {
    const versionMatch = constantsJs.match(/export\s+const\s+APP_VERSION\s*=\s*'([^']+)'/);
    expect(versionMatch).toBeTruthy();
    const version = versionMatch[1];
    // CHANGELOG entries take the form `'<version>': [` inside changelog.js.
    const entryRegex = new RegExp(`'${version.replace(/\./g, '\\.')}'\\s*:\\s*\\[`);
    expect(
      changelogJs,
      `CHANGELOG missing an entry for current APP_VERSION='${version}'. ` +
      `Add an entry like "'${version}': [ '...' ]," inside the export const CHANGELOG={ block in src/core/changelog.js.`
    ).toMatch(entryRegex);
  });

  it('CHANGELOG export opens with a known marker (sanity check)', () => {
    expect(changelogJs).toMatch(/export\s+const\s+CHANGELOG\s*=\s*\{/);
  });

  it('BUILD_HASH export coexists (FM-specific quartet guard)', () => {
    // BUILD_HASH is FM-only (Geri/IM use trinity; FM uses quartet). Sanity-pin.
    expect(constantsJs).toMatch(/export\s+const\s+BUILD_HASH\s*=\s*'/);
  });
});
