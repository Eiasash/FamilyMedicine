---
description: Update study notes in data/notes.json (adult) / data/nelson_notes.json (peds) from Goroll, Nelson, AFP, or MOH-הר"י content, via the note-updater agent.
---

Update or add study notes for the Family Medicine Shlav A topics. Sources: Goroll 8e (adult primary care), Nelson 22e (pediatrics), recent AFP reviews (≤7-yr), and Israeli MOH / הר"י guidance.

Steps:

1. Decide which file the content belongs in:
   - Adult primary-care content → `data/notes.json` (cite Goroll / AFP / MOH).
   - Pediatric content → `data/nelson_notes.json` (cite Nelson).
   Never cross-file a peds note into the adult file or vice-versa.

2. Read the target file first to learn its exact schema and field names. Match them — do not invent new keys.

3. Map the topic to its `TOPICS[27]` index (`src/core/constants.js`) so the note lines up with the rest of the app.

4. Write dense, board-pearl notes: key facts, numbers, thresholds, mechanisms, and exam traps. Cite the source accurately (e.g. "Goroll 8e", "Nelson 22e", "AFP <topic, year>", "MOH/הר"י"). Do not fabricate a chapter number you have not confirmed.

5. Use the `note-updater` agent for the writing pass, and Hebrew terminology per `.claude/skills/hebrew-medical-glossary/SKILL.md`. Preserve RTL whitespace and punctuation.

6. After editing, run `npm run verify` and the `schema-guardian` subagent so the JSON still parses and CI stays green.

## Rules

- Approved sources only — Goroll / Nelson / AFP / MOH-הר"י. No source outside this set.
- Israeli-practice topics cite the relevant MOH / הר"י document, not a foreign guideline.
- Notes are content, not keys — but still have a human review medical claims before merge.
