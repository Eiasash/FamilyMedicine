/**
 * Doc currency guards — fails CI when CLAUDE.md drifts from package.json.
 *
 * Bug class observed 2026-05-05: CLAUDE.md said
 *   "## Current state (v1.21.2, 01/05/26)" + "SW cache `mishpacha-v1.21.2`"
 * while pkg.version was 1.21.11. The SW cache claim was factually verifiable
 * as wrong against the live deploy (live SW = `mishpacha-v1.21.11`).
 *
 * What this guards:
 *   1. "## Current state (vX.Y.Z" header matches pkg.version.
 *   2. "SW cache `mishpacha-vX.Y.Z`" line, if present, matches pkg.version.
 *
 * The SW cache check is conditional — if the line is removed in a future
 * doc rewrite, the test still passes. Only fails when the line is present
 * AND wrong.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(import.meta.dirname, "..");

describe("CLAUDE.md currency vs package.json", () => {
  let content;
  let pkgVer;

  beforeAll(() => {
    content = readFileSync(resolve(ROOT, "CLAUDE.md"), "utf-8");
    pkgVer = JSON.parse(
      readFileSync(resolve(ROOT, "package.json"), "utf-8")
    ).version;
  });

  it('"## Current state (vX.Y.Z" header matches pkg.version', () => {
    const m = content.match(/## Current state \(v(\d+\.\d+\.\d+)/);
    expect(m, 'no "## Current state (vX.Y.Z" header in CLAUDE.md').not.toBeNull();
    expect(m[1]).toBe(pkgVer);
  });

  it('"SW cache `mishpacha-vX.Y.Z`" claim matches pkg.version (when present)', () => {
    const m = content.match(/SW cache `mishpacha-v(\d+\.\d+\.\d+)`/);
    if (m) {
      expect(m[1]).toBe(pkgVer);
    }
    // If the line was removed in a doc rewrite, no failure — the test only
    // catches FALSE claims, not absence of claims.
  });
});
