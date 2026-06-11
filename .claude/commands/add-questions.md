---
description: The legit path to add new questions to the Mishpacha Mega bank — source-grounded generation, schema validation, and a blind board audit. AI keys NEVER auto-merge.
---

Add new questions to the Family Medicine Shlav A bank. There is exactly one sanctioned path: generate from approved sources, validate the schema, run a blind key audit, then have a human review before anything merges. This is a **PUBLIC** repo — never copy from paywalled question banks.

## Schema (each question)

`data/questions.json` items are shaped:

| Field | Type | Notes |
|---|---|---|
| `q` | string | Hebrew stem. Preserve RTL whitespace/punctuation. |
| `o` | array | **exactly 4** options. No letter prefixes (no "A)" / "א)"). |
| `c` | integer | 0..3 — index of the correct option. |
| `c_accept` | array | accepted option indices; **primary `c` MUST be a member**. Non-empty, no duplicates, all in range. |
| `t` | string | source/session tag (e.g. `"Goroll"`, `"AFP"`, `"2024-Sep"`, `"AI-2026-hy"`). Never an integer. Must be in the `ci.yml` whitelist. |
| `st` | string | sub-topic label (optional). |
| `ti` | integer | 0..26 — topic index per `TOPICS[27]` in `src/core/constants.js`. |
| `e` | string | explanation. |

AI high-yield questions live in a **separate** `data/highyield.json` array (same shape plus a `ref` citation field), not in `questions.json`.

## Generation flow (high-yield AI questions)

1. **Generate** from approved sources via the Toranot proxy. `gen_highyield.mjs` is grounded in Goroll / AFP / MOH / USPSTF and tags output `t='AI-2026-hy'` (≤10 Qs per call, `c_accept:[c]`, options carry NO letter prefixes):
   ```bash
   node scripts/gen_highyield.mjs --plan "<ti>:<n>,<ti>:<n>,..."
   ```
   Output is written to the **UNTRACKED** working file `data/highyield.generated.json` — it is NOT auto-merged into `data/highyield.json`.

2. **Validate the key ↔ explanation.** A judge confirms each stored answer matches its own explanation:
   ```bash
   node scripts/verify_questions.mjs data/highyield.generated.json
   ```

3. **Blind board audit.** An independent blind Opus pass re-derives the correct answer from board evidence (no peeking at the stored key):
   ```bash
   node scripts/audit_keys_blind.mjs data/highyield.generated.json
   ```

4. **Human review, then merge.** AI keys NEVER auto-merge. Only after a human reviews the generated file and both checks pass should the accepted items be folded into `data/highyield.json`.

## Manually-authored questions

If adding hand-written questions to `data/questions.json` directly:
1. Source them from Goroll 8e (adult), Nelson 22e (pediatrics), AFP (≤7-yr), or MOH-הר"י — never a paywalled bank.
2. Enforce the schema above: exactly 4 options, `0 <= c < 4`, `c ∈ c_accept`, `ti` in 0..26, `t` a whitelisted string.
3. Pick `ti` by matching the stem to `TOPICS[27]`.
4. Check for near-duplicates: grep a ~30-char unique substring of the stem against `data/questions.json` first (CI rejects conflicting duplicates).
5. After editing, run `npm run verify` and the `schema-guardian` subagent before opening a PR.

## Rules

- **Never auto-merge AI-generated keys.** Generation → validate → blind audit → human review → merge.
- **Never copy paywalled or copyrighted banks.** Public repo.
- Keep the version quartet untouched here — bump it only at release time.
