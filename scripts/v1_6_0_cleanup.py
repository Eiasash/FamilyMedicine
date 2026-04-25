#!/usr/bin/env python3
"""v1.6.0 parser-bleed cleanup for FamilyMedicine.

Discovery (v1_6_0_bleed_scan.py):
  - 0 bleed-pattern matches (next-Q-marker after pos 30) — bank is clean
  - 0 footer-cruft matches (date+exam-header) — clean
  - 1 over-length option (>250 chars): idx 550, t=2023-Jun, o[1] len=256
     This is a LEGITIMATE 4-patient-comparison Q (home-hospitalization criteria,
     2020 position-paper). All four options are detailed clinical vignettes
     (lengths 176/256/200/176) by design — not a parser bleed. Whitelisted
     in LEGIT_LONG_OPTION_INDICES (idx 550) in tests/parserBleedGuard.test.js.

Cleanup approach (mirrors Geriatrics v10.34 5-pass strategy, but minimal scope):

  Pass 1: catch-all bleed regex (no matches expected; runs as safety check)
  Pass 2: footer-cruft strip (no matches expected)
  Pass 3: NO surgical fix (idx 550 is legitimate, not parser-bleed)

  Passes 4-5 reserved for future content drift (none applicable here).

Pure hygiene — bank count unchanged at 1061. Per-tag counts unchanged.
"""
import json, re, shutil
from pathlib import Path

QJ = Path('data/questions.json')
BAK = Path('data/questions.json.bak')

PAST_EXAM_TAGS = {'2020', '2021-Jun', '2022-Jun', '2023-Jun', '2024-May', '2024-Sep', '2025-Jun'}

Q_STEM_KW = r'(?:מטופל|מטופלת|בן\s*\d|בת\s*\d|בנו|בתו|איזה\s|איזו\s|מה\s|מהי\s|מהן\s|מהם\s|אילו\s|מבין\s|מי\s+מהבאים|כל\s+הבאים|לפי\s+המאמר|על\s+פי\s+המאמר|בשאלות)'
BLEED_RE = re.compile(r'\s\d{1,3}(\s+\d{1,3}){0,2}\s*["\'`?]?\s*[.:]\s+(?=' + Q_STEM_KW + ')')
FOOTER_RE = re.compile(r'\d{1,2}[/.]\d{1,2}[/.](?:20)?\d{2}.*שלב')

def main():
    bank = json.load(open(QJ, encoding='utf-8'))
    shutil.copy2(QJ, BAK)
    print(f'Backup -> {BAK}')

    p1 = p2 = 0

    # Pass 1: catch-all bleed regex on all past-exam options (snip if found)
    for q in bank:
        if q.get('t') not in PAST_EXAM_TAGS: continue
        for j, o in enumerate(q.get('o', []) or []):
            if not isinstance(o, str): continue
            m = BLEED_RE.search(o)
            if m and m.start() > 30:
                # Truncate at bleed point
                q['o'][j] = o[:m.start()].rstrip()
                p1 += 1

    # Pass 2: footer-cruft strip
    for q in bank:
        if q.get('t') not in PAST_EXAM_TAGS: continue
        for j, o in enumerate(q.get('o', []) or []):
            if not isinstance(o, str): continue
            m = FOOTER_RE.search(o)
            if m:
                q['o'][j] = o[:m.start()].rstrip()
                p2 += 1

    # Pass 3: NO surgical fix — idx 550 is legitimate 4-patient comparison
    # (all 4 options 176-256 chars by design). Whitelisted in test guard.

    with open(QJ, 'w', encoding='utf-8') as f:
        json.dump(bank, f, ensure_ascii=False, indent=0)

    print(f'Pass 1 (bleed-regex strip): {p1}')
    print(f'Pass 2 (footer-cruft strip): {p2}')
    print(f'Pass 3 (surgical fix): 0 — no parser-bleed cases (idx 550 legit-long, whitelisted)')
    print(f'Total cleanups: {p1 + p2}')

    # Re-validate
    from collections import Counter
    counts = Counter(q.get('t') for q in bank)
    print(f'\nPost-cleanup per-tag counts:')
    for t in sorted(counts):
        print(f'  {t}: {counts[t]}')
    print(f'Total: {len(bank)} (expected unchanged)')

    # Schema sanity: every Q has 4 options, c in 0..3 or list
    bad = 0
    for i, q in enumerate(bank):
        if len(q.get('o', [])) != 4:
            bad += 1
            print(f'  WARN idx={i} t={q.get("t")} option count = {len(q.get("o",[]))}')
        c = q.get('c')
        if not (isinstance(c, int) and 0 <= c <= 3):
            if not isinstance(c, list):
                bad += 1
                print(f'  WARN idx={i} t={q.get("t")} c invalid: {c}')
    if bad == 0:
        print('Schema invariants intact (4 opts/Q, c in 0..3 or list).')

if __name__ == '__main__':
    main()
