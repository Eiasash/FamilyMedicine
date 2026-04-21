#!/usr/bin/env python3
"""Parse 2020 answer key from master_and_sources.pdf.

Format observed:
  1ב        → Q1 = [1]
  3א,ד      → Q3 = [0, 3]
  32א,ב,ג,ד → Q32 = [0, 1, 2, 3] (all accepted after appeal)

Output: exams/answer_keys/2020_v2.json (replacing the partial 2020.json).
"""
import fitz, re, json, sys
from pathlib import Path

BIDI = re.compile(r'[\u200E\u200F\u202A-\u202E\u2066-\u2069\u061C]')
HEB = {'\u05d0':0, '\u05d1':1, '\u05d2':2, '\u05d3':3}

def parse():
    d = fitz.open('exams/pdf/2020_master_and_sources.pdf')
    full = BIDI.sub('', ''.join(d[p].get_text() for p in range(d.page_count)))
    # Line-scan: look for lines starting with digits followed immediately by Hebrew answer letters (optionally comma-separated)
    answers = {}
    # Pattern: line-start + N + adjacent answer letters. Multi-accept uses comma separator.
    # Single letter: "1ב". Multi: "3א,ד" or "32א,ב,ג,ד". No space-only separators (would bleed into next words).
    pat = re.compile(r'(?:\n|^)(\d{1,3})([\u05d0-\u05d3](?:\s*,\s*[\u05d0-\u05d3])*)')
    for m in pat.finditer(full):
        n = int(m.group(1))
        if not (1 <= n <= 200):
            continue
        letters = re.findall(r'[\u05d0-\u05d3]', m.group(2))
        idxs = sorted({HEB[l] for l in letters if l in HEB})
        if idxs and n not in answers:
            answers[n] = idxs
    return answers

def main():
    ans = parse()
    nums = sorted(ans.keys())
    print(f'Parsed {len(ans)} answers')
    print(f'Range: {min(nums)}..{max(nums)}')
    gaps = [n for n in range(1, max(nums)+1) if n not in ans]
    print(f'Gaps in 1..{max(nums)}: {len(gaps)} (first 20: {gaps[:20]})')
    multi = {k:v for k,v in ans.items() if len(v)>1}
    print(f'Multi-accept: {len(multi)} (first 10: {dict(list(multi.items())[:10])})')
    # Special case: all-4 answers usually mean "all accepted after appeal" → likely discard-question
    all4 = [k for k,v in ans.items() if v == [0,1,2,3]]
    print(f'All-4 (discarded): {all4}')

    out = {
        'session': '2020',
        'source_pdf': '2020_master_and_sources.pdf',
        'count': len(ans),
        'max_q': max(nums),
        'multi_accept_count': len(multi),
        'gaps': gaps,
        'answers': {str(k): v for k, v in sorted(ans.items())},
        'note': 'Clean re-parse from master doc line scan. Replaces partial extraction in 2020.json.',
        'usable': len(gaps) == 0,
    }
    Path('exams/answer_keys/2020_v2.json').write_text(
        json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8'
    )
    print(f'Wrote exams/answer_keys/2020_v2.json')

if __name__ == '__main__':
    main()
