#!/usr/bin/env python3
"""Reconstruct Qs whose Hebrew text was CP1255-corrupted (ð artifacts).

Anchor signals:
  - Corrupted q + o (still readable to Sonnet via context)
  - Clean Hebrew explanation (e) — generated correctly because Sonnet inferred meaning
  - Official answer letter (c)

Sonnet outputs clean Hebrew q + 4 clean options that preserve meaning + match e.
Validates: 4 opts, no ð, ≥30 char stem, mostly Hebrew.
"""
import os, sys, json, time, re
from concurrent.futures import ThreadPoolExecutor, as_completed
sys.path.insert(0, 'scripts/exam_audit')
from ingest_session import anthropic_call, parse_json_from_response

HEB_LETTER = {0:'א', 1:'ב', 2:'ג', 3:'ד'}

def has_mojibake(q):
    return 'ð' in q['q'] or any('ð' in o for o in q['o'])

def hebrew_ratio(s):
    if not s: return 0
    heb = sum(1 for c in s if '\u0590' <= c <= '\u05FF')
    return heb / len(s)

def reconstruct(q):
    correct_idx = q['c']
    correct_letter = HEB_LETTER[correct_idx]
    options_block = "\n".join(f"{HEB_LETTER[i]}. {o}" for i, o in enumerate(q['o']))

    system = (
        "You are reconstructing a corrupted Hebrew medical exam question. The original PDF was extracted "
        "with a font encoding bug — the Hebrew letter 'נ' (nun) appears as 'ð' and other characters are "
        "misordered. You have: (1) the corrupted question text, (2) the corrupted 4 options, (3) the OFFICIAL "
        "correct answer letter, (4) a CLEAN Hebrew explanation that was generated from the question.\n\n"
        "Your job: reconstruct the CLEAN original Hebrew question + 4 clean Hebrew options that:\n"
        "  - Preserve the clinical scenario, all numbers, drug names, lab values\n"
        "  - Match the meaning of the explanation\n"
        "  - Are consistent with the official correct answer being the one indicated\n"
        "  - Have NO 'ð' characters\n"
        "  - Are valid medical Hebrew\n\n"
        "Output strict JSON: {\"q\": \"<clean Hebrew question>\", \"o\": [\"<opt א>\", \"<opt ב>\", \"<opt ג>\", \"<opt ד>\"]}.\n"
        "JSON only, no markdown, no preamble."
    )
    user = (
        f"CORRUPTED QUESTION:\n{q['q']}\n\n"
        f"CORRUPTED OPTIONS:\n{options_block}\n\n"
        f"OFFICIAL CORRECT ANSWER: {correct_letter} (index {correct_idx})\n\n"
        f"CLEAN EXPLANATION (anchor):\n{q['e']}\n\n"
        "Output reconstructed JSON now:"
    )
    raw = anthropic_call(system, user, max_tokens=2000, temperature=0.0)
    obj = parse_json_from_response(raw)
    new_q = obj.get("q", "").strip()
    new_o = obj.get("o", [])

    if not new_q or len(new_q) < 30:
        raise ValueError(f"q too short: {new_q!r}")
    if 'ð' in new_q:
        raise ValueError("still has mojibake in q")
    if not isinstance(new_o, list) or len(new_o) != 4:
        raise ValueError(f"need 4 opts, got {len(new_o)}")
    for i, o in enumerate(new_o):
        if 'ð' in o:
            raise ValueError(f"opt {i} still mojibake")
        if not o or len(o.strip()) < 2:
            raise ValueError(f"opt {i} empty")
    if hebrew_ratio(new_q) < 0.20:
        raise ValueError(f"q not mostly Hebrew: ratio={hebrew_ratio(new_q):.2f}")
    return new_q, new_o

def main():
    if not os.environ.get('ANTHROPIC_API_KEY'):
        print('ERROR: ANTHROPIC_API_KEY not set'); sys.exit(1)

    qs = json.load(open('data/questions.json'))
    targets = [(i, q) for i, q in enumerate(qs) if has_mojibake(q)]
    print(f'Found {len(targets)} mojibake Qs to reconstruct')
    if not targets:
        return

    fixed = 0
    failed = []
    start = time.time()

    def worker(item):
        idx, q = item
        try:
            new_q, new_o = reconstruct(q)
            return (idx, new_q, new_o, None)
        except Exception as ex:
            return (idx, None, None, str(ex))

    with ThreadPoolExecutor(max_workers=10) as ex:
        futs = [ex.submit(worker, t) for t in targets]
        for f in as_completed(futs):
            idx, new_q, new_o, err = f.result()
            if err:
                failed.append((idx, err))
            else:
                qs[idx]['q'] = new_q
                qs[idx]['o'] = new_o
                fixed += 1
            if (fixed + len(failed)) % 25 == 0:
                print(f'  {fixed+len(failed)}/{len(targets)} processed in {time.time()-start:.0f}s ({fixed} fixed, {len(failed)} failed)')

    print(f'\nFinal: {fixed} fixed, {len(failed)} failed in {time.time()-start:.0f}s')
    if failed:
        print('First 5 failures:')
        for idx, err in failed[:5]:
            print(f'  [{idx}]: {err[:80]}')

    # Re-scan
    remaining = [i for i, q in enumerate(qs) if has_mojibake(q)]
    print(f'Mojibake Qs remaining: {len(remaining)}')

    with open('data/questions.json', 'w', encoding='utf-8') as f:
        json.dump(qs, f, ensure_ascii=False, indent=1)
    print('Wrote data/questions.json')

if __name__ == '__main__':
    main()
