#!/usr/bin/env python3
"""Re-generate explanations for Qs where existing explanation contradicts the official c.

Sonnet sometimes wrote 'התשובה הנכונה היא ד' when c=א — a teaching disaster.
This script re-prompts Sonnet with explicit instruction to defend the official key answer,
then validates the new explanation actually names the correct letter.
"""
import os, sys, json, re, time
from concurrent.futures import ThreadPoolExecutor, as_completed
sys.path.insert(0, 'scripts/exam_audit')
from ingest_session import anthropic_call, parse_json_from_response

HEB = {'\u05d0':0, '\u05d1':1, '\u05d2':2, '\u05d3':3}
HEB_LETTER = {0:'א', 1:'ב', 2:'ג', 3:'ד'}

CHECK_PATTERNS = [
    re.compile(r'התשובה הנכונה היא\s*[״\'""\-:]?\s*([\u05d0-\u05d3])'),
    re.compile(r'התשובה היא\s*[״\'""\-:]?\s*([\u05d0-\u05d3])'),
]

def claimed_letter(e):
    for p in CHECK_PATTERNS:
        m = p.search(e)
        if m:
            return HEB[m.group(1)]
    return None

def find_mismatches(qs):
    out = []
    for i, q in enumerate(qs):
        c = q.get('c')
        ca = q.get('c_accept', [c])
        cl = claimed_letter(q.get('e',''))
        if cl is not None and cl != c and cl not in ca:
            out.append(i)
    return out

def re_explain_strict(q):
    """Force Sonnet to defend q['c']."""
    correct_idx = q['c']
    correct_letter = HEB_LETTER[correct_idx]
    options_block = "\n".join(f"{HEB_LETTER[i]}. {o}" for i, o in enumerate(q['o']))

    system = (
        "You are writing a Hebrew explanation for an Israeli Family Medicine Shlav A board exam question. "
        "The OFFICIAL ANSWER KEY says the correct answer is given. You MUST defend that answer — "
        "do NOT contradict the official key. Your explanation MUST start with the exact phrase "
        f"'התשובה הנכונה היא {correct_letter}' followed by a dash and the option text. "
        "Then explain WHY this answer is correct (clinical/board-prep reasoning). "
        "If the official answer seems clinically debatable, you may add 'הערה:' at the end with one sentence "
        "noting the appeal/controversy — but the DEFENDED answer must remain the official key. "
        "Output strict JSON: {\"e\": \"<Hebrew explanation, 50-100 words>\"}. "
        "Hebrew only (English drug/condition names OK). No markdown. JSON only."
    )
    user = (
        f"Question:\n{q['q']}\n\n{options_block}\n\n"
        f"OFFICIAL CORRECT ANSWER: {correct_letter}\n\n"
        "Output JSON now:"
    )
    raw = anthropic_call(system, user, max_tokens=600, temperature=0.0)
    obj = parse_json_from_response(raw)
    e = obj.get("e", "").strip()
    if len(e) < 30:
        raise ValueError(f"too short: {e!r}")
    # Verify it actually defends the official answer
    cl = claimed_letter(e)
    if cl is not None and cl != correct_idx:
        raise ValueError(f"still defending wrong letter: claimed={HEB_LETTER.get(cl)} expected={correct_letter}")
    return e

def main():
    if not os.environ.get('ANTHROPIC_API_KEY'):
        print('ERROR: ANTHROPIC_API_KEY not set'); sys.exit(1)

    qs = json.load(open('data/questions.json'))
    mismatches = find_mismatches(qs)
    print(f'Found {len(mismatches)} mismatches in {len(qs)} Qs')
    if not mismatches:
        return

    fixed = 0
    failed = []
    start = time.time()

    def worker(idx):
        try:
            new_e = re_explain_strict(qs[idx])
            return (idx, new_e, None)
        except Exception as ex:
            return (idx, None, str(ex))

    with ThreadPoolExecutor(max_workers=10) as ex:
        futs = {ex.submit(worker, i): i for i in mismatches}
        for f in as_completed(futs):
            idx, new_e, err = f.result()
            if err:
                failed.append((idx, err))
            else:
                qs[idx]['e'] = new_e
                fixed += 1
            if (fixed + len(failed)) % 20 == 0:
                print(f'  {fixed+len(failed)}/{len(mismatches)} processed in {time.time()-start:.0f}s ({fixed} fixed, {len(failed)} failed)')

    print(f'\nFinal: {fixed} fixed, {len(failed)} failed in {time.time()-start:.0f}s')
    if failed:
        print('First 5 failures:', failed[:5])

    # Re-scan for remaining mismatches
    remaining = find_mismatches(qs)
    print(f'Remaining mismatches after fix: {len(remaining)}')

    with open('data/questions.json', 'w', encoding='utf-8') as f:
        json.dump(qs, f, ensure_ascii=False, indent=1)
    print(f'Wrote data/questions.json')

if __name__ == '__main__':
    main()
