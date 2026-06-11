# High-Yield Pilot Audit — 2026-06-11 (v1.26.3, +35)

Blind board-evidence audit of the `scripts/gen_highyield.mjs` pilot batch before
merging any of it into the additive `data/highyield.json` bank.

## Pipeline

1. **Generated:** 202 candidate MCQs (tag `AI-2026-hy`), `data/highyield.generated.json`.
2. **Structural validation + dedup** (vs the live 133-Q `highyield.json` and `questions.json`,
   first-80-char key): 0 structural failures, **133 duplicates**, **69 genuinely new**.
3. **Blind medical audit:** the 69 new Qs were split into 3 chunks and given to 3
   independent Opus subagents. Each subagent saw only `{ti, q, o}` — **no answer key** —
   and independently chose the single best answer + confidence + an ambiguity flag,
   against the FM evidence hierarchy (Goroll 8e primary, Nelson 22e peds, AFP,
   Israeli MOH/הר"י, USPSTF/ADA/GINA/GOLD/KDIGO).
4. **Reconciliation (curation rule):** a candidate is a **survivor** only if the blind
   pick matched the stored key (`c` or any `c_accept`) **and** the auditor raised no
   ambiguity flag. Held out if flagged **or** a blind disagreement at confidence ≥ 70.

## Result

| Bucket | Count |
|---|---|
| New candidates | 69 |
| **Survivors (merged → highyield.json 133→168)** | **35** |
| Held out — ambiguity / multiple-defensible-answer flags | 26 |
| Held out — confident blind disagreements (key likely wrong) | 8 |
| Blind agreement on the **non-flagged** subset | 35/43 = **81%** |

A blind merge of all 69 would have shipped ~34 problematic items (≈49%). The two
dominant flag clusters were HFrEF "next GDMT step" (ARNI-switch vs add-MRA both
class-I) and diabetic-CKD "first add-on" (RAS-blockade vs SGLT2 both foundational) —
genuine two-correct-answer ambiguity unsuitable for a single-best-answer board item.

Notable confident disagreements (key likely wrong, held for human review): a lung-
screening item keyed to the **2013** USPSTF criteria (55–80, ≥30 pk-yr) instead of the
**2021** update (50–80, ≥20 pk-yr); two items where the blind auditor disagreed at
conf ≥ 90 (allergic-rhinitis next step; a lung-screening modality).

## Held out (34) — NOT merged

The 34 held-out Qs remain only in the untracked `data/highyield.generated.json`
and are **not** in the shipped bank. They need human key review before any could be
salvaged. Consistent with the v1.26.0 pattern (133 shipped, 57 flags held out).

Audit performed by Claude Code (Opus 4.8) via 3 blind Opus subagents; the canonical
`scripts/audit_keys_blind.mjs` was unavailable this session (Toranot proxy secret not
in env), so the equivalent blind methodology was run in-session.
