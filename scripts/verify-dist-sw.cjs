#!/usr/bin/env node
// Post-build verification for dist/sw.js.
// Fails hard if:
//   - CACHE name in dist/sw.js doesn't match APP_VERSION in src/core/constants.js
//   - Any file listed in SHELL_URLS or DATA_URLS is missing from dist/
// This is the check that integrity-guard.yml can't do (it only sees repo-root sw.js,
// which is a different manifest pointing at src/ files that get bundled away by Vite).
const fs = require('fs');
const path = require('path');

function fatal(msg) { console.error(`[verify-dist-sw] FATAL: ${msg}`); process.exit(1); }

const distSwPath = 'dist/sw.js';
const constPath = 'src/core/constants.js';
if (!fs.existsSync(distSwPath)) fatal(`${distSwPath} missing — did scripts/build.sh run to completion?`);
if (!fs.existsSync(constPath)) fatal(`${constPath} missing`);

const distSw = fs.readFileSync(distSwPath, 'utf8');
const constSrc = fs.readFileSync(constPath, 'utf8');

const mApp = constSrc.match(/APP_VERSION\s*=\s*['"]([^'"]+)['"]/);
const mCache = distSw.match(/CACHE\s*=\s*['"]mishpacha-v([^'"]+)['"]/);
if (!mApp) fatal('APP_VERSION not found in src/core/constants.js');
if (!mCache) fatal('CACHE (mishpacha-vX.Y.Z) not found in dist/sw.js');
if (mApp[1] !== mCache[1]) {
  fatal(`version drift — APP_VERSION=${mApp[1]}, dist/sw.js CACHE=mishpacha-v${mCache[1]}`);
}

function extractList(src, name) {
  const m = src.match(new RegExp(`${name}\\s*=\\s*\\[([^\\]]*)\\]`));
  if (!m) return null;
  return [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]);
}
const shell = extractList(distSw, 'SHELL_URLS');
const critical = extractList(distSw, 'CRITICAL_DATA');
const lazy = extractList(distSw, 'LAZY_DATA');
if (!shell) fatal('SHELL_URLS array not found in dist/sw.js');
if (!critical) fatal('CRITICAL_DATA array not found in dist/sw.js (split landed v1.21.15)');
if (!lazy) fatal('LAZY_DATA array not found in dist/sw.js (split landed v1.21.15)');
const all = [...shell, ...critical, ...lazy];

const missing = all.filter(p => !fs.existsSync(path.join('dist', p)));
if (missing.length) {
  console.error(`[verify-dist-sw] FATAL: ${missing.length} SW-manifested file(s) missing from dist/:`);
  missing.forEach(f => console.error(`  ✗ dist/${f}`));
  console.error('Either add the file to scripts/build.sh cp steps, or remove from the SW heredoc.');
  process.exit(1);
}

// Also sanity-check that the cache-populated set has no duplicates (cache.addAll rejects)
const dupes = all.filter((v, i, a) => a.indexOf(v) !== i);
if (dupes.length) fatal(`duplicate entries: ${dupes.join(', ')}`);

console.log(`[verify-dist-sw] OK — CACHE=mishpacha-v${mCache[1]}, ${all.length} cached paths verified (${shell.length} shell + ${critical.length} critical + ${lazy.length} lazy)`);
