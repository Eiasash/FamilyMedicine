/**
 * Deploy config guards — ratchet tests pinned to bugs that have actually shipped.
 *
 * v1.2.10 → v1.2.11 regression (22/04/26):
 *   vite.config.js had `base: '/InternalMedicine/'` copy-pasted from the
 *   sibling Pnimit repo. Production build emitted asset URLs like
 *   /InternalMedicine/assets/mishpacha-mega-*.{js,css}, which 404 on the
 *   FamilyMedicine GitHub Pages site. Site was stuck on "Loading…" because
 *   the bundled module script + stylesheet never resolved.
 *
 * These guards fail the build BEFORE a broken deploy can ship.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

const rootDir = resolve(import.meta.dirname, '..');

function readFile(filename) {
  return readFileSync(resolve(rootDir, filename), 'utf-8');
}

describe('deploy config — vite base path must match this repo', () => {
  const REPO_NAME = 'FamilyMedicine';
  const SIBLINGS = ['InternalMedicine', 'Geriatrics', 'Toranot'];

  let viteConfig;
  beforeAll(() => {
    viteConfig = readFile('vite.config.js');
  });

  test('vite.config.js base is /FamilyMedicine/', () => {
    // Match the base: '...' line — single or double quotes, any whitespace.
    const m = viteConfig.match(/base\s*:\s*['"]([^'"]+)['"]/);
    expect(m, 'vite.config.js must declare a base: path').not.toBeNull();
    expect(m[1]).toBe(`/${REPO_NAME}/`);
  });

  test('vite.config.js contains no sibling-repo base paths', () => {
    for (const sibling of SIBLINGS) {
      expect(
        viteConfig.includes(`/${sibling}/`),
        `vite.config.js must not reference sibling repo "${sibling}" — ` +
          `this is the exact copy-paste bug that broke deploy in v1.2.10.`,
      ).toBe(false);
    }
  });
});

describe('deploy config — package.json version matches APP_VERSION + SW cache', () => {
  // Version sync is already asserted elsewhere (ci.yml + sync-sw-version.cjs),
  // but this test localizes the check so `npm test` catches drift without
  // needing the full CI pipeline to run first.
  let pkg, constants, sw;
  beforeAll(() => {
    pkg = JSON.parse(readFile('package.json'));
    constants = readFile('src/core/constants.js');
    sw = readFile('sw.js');
  });

  test('package.json version === APP_VERSION === SW CACHE suffix', () => {
    const pkgVer = pkg.version;
    const appVerMatch = constants.match(/APP_VERSION\s*=\s*'([^']+)'/);
    const swCacheMatch = sw.match(/CACHE\s*=\s*'mishpacha-v([^']+)'/);

    expect(appVerMatch, 'APP_VERSION must be defined in src/core/constants.js').not.toBeNull();
    expect(swCacheMatch, "sw.js must define CACHE='mishpacha-v<ver>'").not.toBeNull();

    expect(appVerMatch[1]).toBe(pkgVer);
    expect(swCacheMatch[1]).toBe(pkgVer);
  });
});
