---
name: mishpacha-mega-dev
description: Development and content work on Mishpacha Mega (Family Medicine Shlav A PWA). Trigger on repo modifications, deploy requests, ingestion work, content changes, or any mention of github.com/Eiasash/FamilyMedicine or eiasash.github.io/FamilyMedicine.
---

# Mishpacha Mega dev skill

Sibling of Pnimit Mega — modular build, same engine. **Always read `CLAUDE.md` at repo root first** for current version, question counts, and pending work (those numbers live in code and drift quickly).

## Quick ref
- Repo: github.com/Eiasash/FamilyMedicine
- Live: https://eiasash.github.io/FamilyMedicine/
- Main file: `mishpacha-mega.html` (shell, ~155 lines)
- 21 JS modules in `src/`, 8 CSS in `src/styles/`
- Data: `data/*.json` (+ `goroll_chapters.json`, `nelson_chapters.json`, `harrison_chapters.json` at root)
- Syllabus: P0062-2025
- 27 topics (`ti` range 0-26)

## Deploy (Vite build on GitHub Actions, then Pages)
`git push origin main` → `bash scripts/build.sh` → `dist/` uploaded as Pages artifact. **This is NOT a static push-the-source flow** like Shlav A — the live site is the Vite-built dist.

**`vite.config.js` base must be `/FamilyMedicine/`.** A wrong base here (e.g. a sibling's path) produces hashed asset URLs that 404 on the live site and leaves the page stuck on "Loading…". `tests/deployConfigGuard.test.js` fails CI if this regresses.

## Version sync
`src/core/constants.js` APP_VERSION + `sw.js` CACHE + `package.json` version must match.

## Do before push
1. `npm test` — all tests must pass (count grows as content ingests; see `CLAUDE.md`)
2. `node --check` every modified JS file
3. `node scripts/sync-sw-version.cjs` if version bumped

## Don't
- Don't inline data into HTML (keep in `data/*.json`)
- Don't rebuild flat — modular split is the right choice
- Don't commit the Anthropic key or GitHub PATs (anon Supabase key is fine — it's public-read)
- Don't copy-paste `vite.config.js` from Pnimit without updating `base:`
