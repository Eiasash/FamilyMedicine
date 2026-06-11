---
description: Full audit of Mishpacha Mega — find bugs, wrong answers, UX issues, schema/version drift
---

Perform a comprehensive audit of the Family Medicine Shlav A app (Mishpacha Mega). The app is a Vite + ES-modules PWA: entry `mishpacha-mega.html` → `src/ui/app.js`, with a 32-module split under `src/`. Read the relevant modules before judging.

Check:

1. **Question integrity.** Sample ~20 items from `data/questions.json` (and a few from `data/highyield.json`). For each, sanity-check that `c` is a plausible correct index and that the `c_accept` invariant holds (primary `c` ∈ `c_accept`, non-empty, no dups, in range). Re-derive answers against Goroll/Nelson/AFP/MOH where you can; never assume the stored `c` is correct.

2. **Topic mapping.** Every `ti` in `data/questions.json` and `data/highyield.json` is an integer 0..26 and maps to a real entry in `TOPICS[27]` (`src/core/constants.js`). Spot-check that the topic matches the clinical content.

3. **Tag whitelist.** Every `t` is in the whitelist defined in `.github/workflows/ci.yml`. Flag unknown tags.

4. **AI explain feature.** `callAI` (and the explain path) exist, handle errors gracefully, and route through the shared proxy. Do not paste any secret value into the report.

5. **Syllabus compliance.** Content cites only Goroll 8e / Nelson 22e / AFP (≤7-yr) / MOH-הר"י. Pediatric items cite Nelson; adult items cite Goroll/AFP. Flag any out-of-set source.

6. **JavaScript health.** No syntax errors (`node --check`), no truncated patterns (empty async IIFEs, orphan `async`), and the integrity-guard critical-function list is fully present.

7. **Mobile / RTL UX.** Tap targets ≥44px, Hebrew RTL correctness, dark-mode completeness.

8. **Version quartet sync.** `package.json` "version", `sw.js` `CACHE='mishpacha-v<ver>'`, and `src/core/constants.js` `APP_VERSION` + `BUILD_HASH` (`'<Nq>q-v<ver>'`, `<Nq>` = `data/questions.json` count) all agree. Also `vite.config.js` `base === '/FamilyMedicine/'`.

9. **Service worker.** `sw.js` precaches the required data files and its cache marker matches the app version.

Output: a numbered list of bugs/issues, each tagged priority HIGH / MED / LOW, with a concrete fix recommendation. Reference questions by 0-based array index. Do NOT apply fixes — this command reports only.
