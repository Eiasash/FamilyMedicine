# High-Yield Batch 2 — 2026-06-11 (v1.26.5, +40)

Fresh-generated AI high-yield MCQs, gated before merging into the additive
`data/highyield.json` bank (168 → 208).

## Why subagent-generated
The canonical `gen_highyield.mjs` pipeline routes through the Toranot proxy
(`TORANOT_API_SECRET`), which was unavailable this session. The same intent was
run **in-session via Opus subagents** — 5 generators (one per FM domain cluster),
each producing ORIGINAL Hebrew clinical vignettes, then the same blind-audit gate.

## Pipeline
1. **Generate:** 5 Opus subagents × 8 = 40 candidates (tag `AI-2026-hy`). Each was
   explicitly warned off the ambiguity traps the prior pilot exposed and told to
   build single-best-answer vignettes:
   - HFrEF "next GDMT step" offering both ARNI-switch and add-MRA → instead, patient already on an MRA.
   - Diabetic-CKD "first add-on" offering both RAS-blocker and SGLT2i → instead, patient already on a RAS-blocker so SGLT2i is unambiguous.
   - Acute-gout "first-line" offering both NSAID and steroid → instead, a contraindication (CKD4 + PUD bleed) leaves steroid the only safe option.
   - USPSTF lung screening → current **2021** criteria (50-80, ≥20 pack-yr), with the outdated 2013 criteria used only as a distractor.
2. **Structural validation:** 0 fails (4 options, c in range, c_accept null, tag, ti 0-26, unique options).
3. **Dedup** vs the live 168-Q `highyield.json` + 1121-Q `questions.json`: **0 duplicates** (fresh-generated).
4. **Blind audit:** 3 Opus subagents, each independently answering WITHOUT the key.

## Result

| Metric | Count |
|---|---|
| Generated | 40 |
| Structural fails | 0 |
| Duplicates | 0 |
| **Blind agreement (pick == key)** | **40/40 = 100%** |
| Ambiguity flags | 0 |
| **Merged → highyield.json (168→208)** | **40** |

This is markedly cleaner than the 2026-06-11 *pilot* (81% blind agreement, 38%
flags, 35/69 shipped) — because the generators built genuine single-best-answer
vignettes that pre-empt the trap patterns.

**Caveat (honest):** generators and blind auditors are both Opus, so 100%
agreement reflects internal consistency + unambiguity, not an independent
ground-truth proof. Mitigations applied: explicit current-guideline instructions,
independent blind re-derivation matching every key, zero ambiguity flags, and a
manual spot-read of the trap-adjacent items (diabetic-CKD, gout-in-CKD,
lung-screening) confirming correct keys + sound explanations. `ti` topic tags were
re-derived by content (a subagent re-tag against the 27-topic map) after the
generators mis-guessed some indices.

Generated + audited by Claude Code (Opus 4.8) via Opus subagents.
