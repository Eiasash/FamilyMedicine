---
description: Run the full local CI mirror — `npm run verify` plus the schema-guardian subagent. Non-destructive — reports pass/fail only.
allowed-tools: Task, Bash, Read
---

# /validate

Validates the working tree the way CI does, without waiting for GitHub Actions.

## Execution

Claude should:

1. Run `npm run verify` and capture the full output. For Mishpacha Mega this runs:
   `node scripts/regen_manifest.cjs --check && node scripts/sync-sw-version.cjs && npm test && bash scripts/build.sh`
   (manifest in sync → SW version sync → Vitest → build).
2. Launch the `schema-guardian` subagent with: "Run every check from ci.yml and integrity-guard.yml against the current working tree. Report pass/fail with specifics. Flag anything that would fail CI." This covers the gates `npm run verify` does not (JSON schema, tag whitelist, conflicting duplicates, integrity-guard GATEs 1–6).
3. Surface both reports to the user.
4. If everything passes → say so plainly.
5. If anything fails → do NOT suggest shipping; point the user at the specific failures with exact output.

## Rules

- Never auto-fix anything. The failures are the user's signal.
- Never bump the version quartet or commit automatically — those are human decisions.
- If `npm test` is slow, still run it — partial validation is misleading.
