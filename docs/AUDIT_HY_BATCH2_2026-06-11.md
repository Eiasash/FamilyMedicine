# High-Yield Batch 2 — 2026-06-11 (v1.26.5, +35 shipped)

Fresh-generated AI high-yield MCQs, gated before merging into the additive
`data/highyield.json` bank (168 → 203 after 5 Codex-flagged items were dropped).

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
| Opus blind agreement (pick == key) | 40/40 = 100% |
| Fable blind agreement (different model) | 40/40 = 100% |
| **Codex / GPT cross-vendor review** | **5 P2 issues found → dropped** |
| **Merged → highyield.json (168→203)** | **35** |

## Three-model gate (the point)
1. **Opus** generated + blind-audited → 40/40, 0 flags.
2. **Fable** (a different Anthropic model) blind-audited independently → 40/40, 0 disagreements.
3. **Codex / GPT** (different *vendor*) reviewed the PR and flagged **5 real P2 nuance issues that BOTH Opus and Fable missed** — shared Anthropic-family blind spots:
   - Cervical screening: stem age 30 but key uses the 21-29 pathway (at 30, hrHPV/cotesting are also valid).
   - Gonococcal urethritis: chlamydia not excluded → CDC 2021 is ceftriaxone **+ doxycycline**, not ceftriaxone alone.
   - Nonsevere AOM (2yo, unilateral, no severe features): AAP allows observation, so amoxicillin-only-keyed is ambiguous.
   - Stage-2 HTN (150/96): ACC/AHA starts **two** agents; single-drug key = undertreatment.
   - Gout explanation: cited the pre-ACR-2020 "don't start allopurinol during a flare" teaching (reversed in 2020).

Those **5 were dropped**; the **35 triple-clean** questions shipped.

**Lesson:** same-vendor agreement (Opus + Fable both 100%) is NOT independent
validation — cross-VENDOR review (GPT) found what the shared blind spots hid. For
AI-generated medical content, a different-vendor auditor is the meaningful gate.
`ti` topic tags were re-derived by content (subagent re-tag vs the 27-topic map).

Generated + audited by Claude Code (Opus 4.8) via Opus subagents.
