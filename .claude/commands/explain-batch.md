---
description: Explain a batch of high-frequency Family Medicine MCQs with Goroll/Nelson/AFP/MOH sourcing, via the question-explainer agent.
---

Produce board-style explanations for a batch of the highest-yield questions in the Mishpacha Mega bank.

Steps:

1. **Pick the batch.** From `data/questions.json` (and optionally `data/highyield.json`), prioritise by:
   - High-weight topics — read `IMA_WEIGHTS[27]` / `EXAM_FREQ[27]` in `src/core/constants.js` and favour the heaviest topic indices.
   - Recent exam sessions (`t` like `"2024-Sep"`, `"2025-Jun"`).
   - Pediatric coverage (Nelson) so peds isn't under-explained.
   Default batch size 10 unless the user specifies N.

2. **Explain each item** using the `question-explainer` agent's format:
   - Correct answer + mechanism.
   - Why each wrong option fails.
   - A one-line board pearl.
   - A source citation: Goroll 8e (adult), Nelson 22e (peds), AFP (≤7-yr), or MOH-הר"י — matching the actual content. Peds → Nelson; adult → Goroll/AFP.
   - The topic name (0..26 from `TOPICS`).

3. **Verify the key before explaining.** If your re-derived answer disagrees with the stored `c`, flag the discrepancy rather than rationalising the stored key. Confirm any `c_accept` you rely on includes `c`.

4. **Output.** A clean Hebrew explanation per question, each headed by its 0-based array index and topic. Do NOT write anything back to the data files — this command only produces explanations for review.

## Rules

- Hebrew answer text; keep abbreviations (MMSE, eGFR, USPSTF, etc.) as-is.
- Never fabricate a source or a chapter number you haven't confirmed — cite at the source level when unsure.
- Reference questions by array index; `highyield.json` is indexed separately.
