#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Round 2 audit-fix-deploy: clean year metadata in data/afp_hari_index.json.

Findings (R1 deferred item #2):
- 2 הר"י papers with empty year string (idx 440, 452) — no year in source frontmatter or PDF stem. Set to null.
- 14 הר"י papers with wrong year extracted (the buggy extractor pulled an unrelated 4-digit number from the PDF body text instead of the year encoded in the title). Recover from title regex (latest 20XX in title/filename).
- 1 הר"י paper (idx 521) where year is encoded as "02-25" filename suffix → 2025.
- 4 pre-2010 AFP papers (idx 95=2003, 167=1990, 307=2004, plus a 2nd 2004 if any) are GENUINELY old. Skill spec says don't fabricate — leave year as-is, BUT they're outside the rolling 7-year window declared in CLAUDE.md (2018-2025). Documented as legacy outliers; tests pin the count.

Schema invariant after this pass:
- year is "YYYY" (4-digit string) | null. NEVER empty string.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IDX_PATH = ROOT / "data" / "afp_hari_index.json"


def fix_hri_year(p):
    """Return corrected year for an הר"י paper, or None to leave unchanged."""
    title = p.get("title", "") or ""
    fname = p.get("filename", "") or ""
    cur = p.get("year", "")
    blob = title + " " + fname

    # MM-YY suffix in filename (e.g. "02-25" → 2025)
    m = re.search(r"(\d{2})-(\d{2})$", fname)
    if m:
        yy = int(m.group(2))
        return str(2000 + yy if yy < 80 else 1900 + yy)

    # 4-digit year in title or filename — take the latest mention
    years = re.findall(r"\b(20\d{2})\b", blob)
    if years:
        return str(max(int(y) for y in years))

    # No year information available — sentinel
    if cur in ("", None):
        return None  # explicit null

    return None  # don't touch unless cur is empty


def main():
    idx = json.loads(IDX_PATH.read_text(encoding="utf-8"))
    papers = idx["papers"]

    changed_year = 0
    set_null = 0
    legacy_afp = []

    for i, p in enumerate(papers):
        kind = p.get("kind", "")
        cur_year = p.get("year", "")

        if kind == "הרי":
            recovered = fix_hri_year(p)
            if recovered is None and cur_year in ("", None):
                # truly unknown
                p["year"] = None
                set_null += 1
            elif recovered is not None and str(recovered) != str(cur_year):
                p["year"] = str(recovered)
                changed_year += 1
        elif kind == "AFP":
            # Track pre-2018 AFP outliers but don't fabricate
            try:
                yi = int(str(cur_year))
                if yi < 2018:
                    legacy_afp.append((i, yi, p.get("title", "")[:60]))
            except (ValueError, TypeError):
                pass

    # Recompute totals (in case schema validators care)
    totals = {"afp": sum(1 for p in papers if p.get("kind") == "AFP"),
              "hari": sum(1 for p in papers if p.get("kind") == "הרי")}
    idx["totals"] = totals

    IDX_PATH.write_text(
        json.dumps(idx, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print(f"Fixed {changed_year} HRI year corrections (recovered from title/filename)")
    print(f"Set {set_null} HRI papers to year=null (no year info available)")
    print(f"Legacy AFP (pre-2018, kept as-is): {len(legacy_afp)}")
    for i, y, t in legacy_afp:
        print(f"  idx={i} year={y} title={t!r}")


if __name__ == "__main__":
    main()
