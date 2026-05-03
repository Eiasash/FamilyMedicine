"""Harrison citation correctness audit — FamilyMedicine port of the Geri audit.

4 layers (mirrors the Geri PR-pattern v10.64.16):
1. BOUND CHECK: any Harrison Ch >505 in q.ref or q.e is structurally impossible
2. DICT-MEMBERSHIP: every Harrison Ch cited must be a key in data/harrison_22e_toc.json
3. TITLE-MATCH: for `Harrison Ch X — TITLE` citations, TITLE must share at least one
   strong (>=4 char, non-stopword) token with harrison_22e_toc.json[X].title
4. SELF-CONSISTENCY: same Ch number cited with different titles -> suspicious

FM also cites Goroll (1-239), Nelson, AFP, Lerner, הר"י — those don't have a
canonical numbered TOC the same way (Goroll TOC is in goroll_chapters.json
indexed by position, not by chapter number that maps to a global ID space),
so we only audit Harrison here.

Output: .audit_logs/harrison_title_consistency.json
"""
import json, re, collections
from pathlib import Path

REPO = Path(r"C:/Users/User/repos/FamilyMedicine")
QF = REPO / "data" / "questions.json"
HF = REPO / "data" / "harrison_22e_toc.json"
OUT = REPO / ".audit_logs" / "harrison_title_consistency.json"

NIQQUD = re.compile(r"[֑-ׇ]")
STOPWORDS = {
    'with','this','that','from','have','been','more','most','when','what',
    'some','than','only','also','each','about','into','over','such','very',
    'other','their','these','those','which','where','will','shall',
    'disease','approach','patient','syndromes','syndrome',
}

def normalize(s):
    if not s: return ""
    s = NIQQUD.sub("", s.strip())
    return re.sub(r"\s+", " ", s).strip().lower()

def title_tokens(s):
    """Lowercased word tokens of len>=3, both Hebrew and Latin, niqqud-stripped, stopword-filtered."""
    if not s: return set()
    n = normalize(s)
    raw = {t for t in re.findall(r"[A-Za-z֐-׿]{3,}", n)}
    return {t for t in raw if t not in STOPWORDS}

# Patterns:
#   "Harrison Ch 365 — Gout and Other Crystal-Associated Arthropathies"
#   "Harrison Ch 286 — Heart Failure"
#   "Harrison Ch 365 (Gout and Other Crystal-Associated Arthropathies)"
HR_TITLED = re.compile(
    r'Harrison\s*Ch\s*(\d+)\s*(?:[—–\-]|\()\s*([^·\n)]{3,150}?)\s*(?:[·\n)]|$)',
    re.IGNORECASE,
)
# Bare-number citation
HR_ANY = re.compile(r'Harrison\s*Ch\s*(\d+)', re.IGNORECASE)

qs = json.loads(QF.read_text(encoding='utf-8'))
hr_toc = json.loads(HF.read_text(encoding='utf-8'))
print(f"Loaded {len(qs)} questions, TOC has {len(hr_toc)} chapters")

# ===== CHECK 0: BOUND CHECK =====
out_of_bounds = []
for i, q in enumerate(qs):
    for field in ('ref', 'e'):
        v = q.get(field) or ''
        for m in HR_ANY.finditer(v):
            n = int(m.group(1))
            if n > 505:
                out_of_bounds.append({'idx': i, 'field': field, 'chapter': n,
                                      'snippet': v[max(0,m.start()-20):m.end()+40]})

print(f"=== CHECK 0: out-of-bounds (>505) ===")
print(f"  {len(out_of_bounds)} citations")
for r in out_of_bounds[:10]:
    print(f"  idx={r['idx']} field={r['field']} Ch {r['chapter']} | {r['snippet']!r}")

# ===== CHECK 1: DICT-MEMBERSHIP =====
non_member = []
for i, q in enumerate(qs):
    for field in ('ref', 'e'):
        v = q.get(field) or ''
        for m in HR_ANY.finditer(v):
            n = int(m.group(1))
            if n > 505: continue  # already in out-of-bounds
            if str(n) not in hr_toc:
                non_member.append({'idx': i, 'field': field, 'chapter': n,
                                   'snippet': v[max(0,m.start()-20):m.end()+40]})

print(f"\n=== CHECK 1: dict-membership (Ch not in TOC) ===")
print(f"  {len(non_member)} citations")
for r in non_member[:10]:
    print(f"  idx={r['idx']} field={r['field']} Ch {r['chapter']} | {r['snippet']!r}")

# ===== CHECK 2: TITLE-MATCH =====
title_mismatches = []
for i, q in enumerate(qs):
    for field in ('ref', 'e'):
        v = q.get(field) or ''
        for m in HR_TITLED.finditer(v):
            n = int(m.group(1))
            cited_title = m.group(2).strip().rstrip('*').rstrip('—–-').strip()
            if len(cited_title) < 3: continue
            if str(n) not in hr_toc: continue
            canon_title = hr_toc[str(n)].get('title', '') if isinstance(hr_toc[str(n)], dict) else str(hr_toc[str(n)])
            cited_strong = {t for t in title_tokens(cited_title) if len(t) >= 4}
            canon_strong = {t for t in title_tokens(canon_title) if len(t) >= 4}
            if cited_strong and canon_strong and not (cited_strong & canon_strong):
                title_mismatches.append({
                    'idx': i, 'field': field, 'chapter': n,
                    'cited': cited_title[:80],
                    'canonical': canon_title[:80],
                })

print(f"\n=== CHECK 2: title-match (cited vs canonical) ===")
print(f"  {len(title_mismatches)} mismatches")
for r in title_mismatches[:20]:
    print(f"  idx={r['idx']} field={r['field']} Ch {r['chapter']}")
    print(f"    cited:    {r['cited']!r}")
    print(f"    canonical:{r['canonical']!r}")

# ===== CHECK 3: SELF-CONSISTENCY =====
ch_titles = collections.defaultdict(list)
for i, q in enumerate(qs):
    for field in ('ref', 'e'):
        v = q.get(field) or ''
        for m in HR_TITLED.finditer(v):
            n = int(m.group(1))
            t = m.group(2).strip().rstrip('*').rstrip('—–-').strip()
            if len(t) < 3: continue
            ch_titles[n].append({'idx': i, 'field': field, 'title': t})

self_disagreements = []
for ch, recs in sorted(ch_titles.items()):
    distinct = collections.defaultdict(list)
    for r in recs:
        key = normalize(r['title'])
        distinct[key].append(r)
    if len(distinct) > 1:
        self_disagreements.append({
            'chapter': ch,
            'distinct_titles': [
                {'title': v[0]['title'], 'count': len(v),
                 'samples': [{'idx': r['idx'], 'field': r['field']} for r in v[:3]]}
                for v in distinct.values()
            ],
        })

print(f"\n=== CHECK 3: self-consistency (same ch, different titles) ===")
print(f"  {len(self_disagreements)} chapters with >1 distinct cited title")
for d in self_disagreements[:10]:
    print(f"  Ch {d['chapter']}:")
    for t in d['distinct_titles']:
        print(f"    x{t['count']}: {t['title'][:70]!r}")
        for s in t['samples'][:2]:
            print(f"        idx={s['idx']} field={s['field']}")

OUT.write_text(json.dumps({
    'out_of_bounds': out_of_bounds,
    'non_member': non_member,
    'title_mismatches': title_mismatches,
    'self_disagreements': self_disagreements,
}, indent=2, ensure_ascii=False), encoding='utf-8')
print(f"\nWrote {OUT}")
