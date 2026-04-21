---
name: mishpacha-mega-dev
description: Development and content work on Mishpacha Mega (Family Medicine Shlav A PWA). Trigger on repo modifications, deploy requests, ingestion work, content changes.
---

# Mishpacha Mega dev skill

Sibling of Pnimit Mega — modular build, same engine.

## Quick ref
- Repo: github.com/Eiasash/FamilyMedicine
- Live: https://eiasash.github.io/FamilyMedicine/
- Main file: `mishpacha-mega.html` (shell, ~155 lines)
- 21 JS modules in `src/`, 8 CSS in `src/styles/`
- Data: `data/*.json` (+ `goroll_chapters.json`, `harrison_chapters.json` at root)
- Syllabus: P0062-2025
- 27 topics, `ti` range 0-26

## Deploy
`git push origin main` → GitHub Pages auto-deploys ~60s.

## Version sync
`src/core/constants.js` APP_VERSION + `sw.js` CACHE + `package.json` version must match.

## Do before push
1. `npm test` — all 155 must pass
2. `node --check` every modified JS file
3. `node scripts/sync-sw-version.cjs` if version bumped

## Don't
- Don't inline data into HTML (keep in `data/*.json`)
- Don't rebuild flat (Pnimit tried the monolith; modular is the right choice)
- Don't commit anon keys as "secrets" — they're public-read and live in constants.js
