#!/usr/bin/env python3
"""
AFP / הר"י extraction pipeline for the family-medicine Shlav-A board exam repo.

Walks every top-level Hebrew specialty folder, finds AFP/*.pdf and הרי/*.pdf,
and produces two outputs:

  1. docs/references/afp_hari/.raw/{specialty}/{kind}/{name}.txt   (gitignored)
     - verbatim pdftotext -layout output, for grep / full-text search

  2. docs/references/afp_hari/{specialty}/{kind}/{name}.md          (committed)
     - YAML frontmatter (title, source, year, specialty, topic, pdf, raw)
     - Abstract (heuristically extracted for AFP)
     - Key Recommendations / SORT block if present
     - Opening body paragraphs
     - Links back to the source PDF and raw text

Also writes a per-specialty index.md and a top-level README.md.

Syllabus filter (Shlav A 2026):
  The official required-reading list (ועדת הבחינות ברפואת המשפחה) accepts AFP review
  articles and Israeli guidelines published within the 7-year window ending 12 months
  before the exam. For Shlav A May 2026 that window is 2018-06-01 → 2025-05-31.
  Papers outside the window are skipped by default. Override with --min-year / --max-year.

Usage:
  python3 scripts/extract_afp_hari.py                 # syllabus window (default)
  python3 scripts/extract_afp_hari.py --all-years     # no date filter
  python3 scripts/extract_afp_hari.py --limit 5       # just 5 PDFs per specialty (smoke test)
  python3 scripts/extract_afp_hari.py --force         # rewrite even if md already exists
  python3 scripts/extract_afp_hari.py --exam-year 2027  # shift the 7-year window
"""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_ROOT = ROOT / "docs" / "references" / "afp_hari"
RAW_ROOT = OUT_ROOT / ".raw"

# Top-level specialty folders we process. Anything not in this list (docs/, scripts/, .git/) is ignored.
SPECIALTIES = [
    "אא_ג, רפואת הפה והשיניים",
    "אונקולוגיה",
    "אורולוגיה",
    "אורתופדיה",
    "אנדוקרינולוגיה",
    "גסטרואנטרולוגיה",
    "המטולוגיה",
    "כאב",
    "כירורגיה",
    "מחלות זיהומיות",
    "נוירולוגיה",
    "נפרולוגיה, אלקטרוליטים ולחץ-דם",
    "סוגיות ותסמינים כלליים",
    "עור",
    "עיניים",
    "פסיכיאטריה",
    "קידום בריאות ורפואה מונעת",
    "קרדיולוגיה",
    "ראומטולוגיה",
    "ריאות",
    "רפואת ילדים",
    "רפואת נשים",
    "תרופות, פרמקולוגיה וטוקסיקולוגיה",
]
# Source folder → kind. רפואת נשים uses "הנחיות הרי" instead of "הרי" — normalize to הרי on output.
KIND_FOLDERS: dict[str, str] = {
    "AFP": "AFP",
    "הרי": "הרי",
    "הנחיות הרי": "הרי",
}


@dataclass
class PaperMeta:
    title: str
    year: str | None
    citation: str | None
    abstract: str | None
    sort_block: str | None
    opening_paragraphs: list[str] = field(default_factory=list)


# ----------------------- text extraction -----------------------


def pdftotext(pdf: Path, out_txt: Path) -> bool:
    """Run `pdftotext -layout pdf out`. Returns True on success."""
    out_txt.parent.mkdir(parents=True, exist_ok=True)
    try:
        subprocess.run(
            ["pdftotext", "-layout", str(pdf), str(out_txt)],
            check=True,
            stderr=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            timeout=60,
        )
        return out_txt.exists() and out_txt.stat().st_size > 0
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, FileNotFoundError):
        return False


# ----------------------- parsing heuristics -----------------------

DATE_SUFFIX_RE = re.compile(r"\s*\d{1,2}-\d{2,4}\s*$")
YEAR_RE = re.compile(r"(20\d{2}|19\d{2})")
# Catch `Am Fam Physician. 2024;109(1):22-29.` including volume/issue/pages.
AFP_CITATION_RE = re.compile(
    r"Am\s+Fam\s+Physician\.?\s*\d{4};\s*\d{1,4}\s*\(\s*[\d\sSuppl]+\s*\)\s*:?\s*[\d\-\u2013\u2014A-Z]*",
    re.IGNORECASE,
)
MULTI_WS_RE = re.compile(r"[ \t]+")
# Zero-width and similar invisibles that pdftotext sometimes emits.
ZERO_WIDTH_RE = re.compile(r"[\u200B\u200C\u200D\u200E\u200F\uFEFF\u202A-\u202E\u2066-\u2069]")


def strip_zw(s: str) -> str:
    return ZERO_WIDTH_RE.sub("", s)


def clean_title_from_filename(stem: str) -> str:
    """Strip trailing MM-YY / MM-YYYY date and smooth whitespace."""
    title = DATE_SUFFIX_RE.sub("", stem).strip()
    title = re.sub(r"\s+-\s+", " — ", title)
    return title.strip(" -_")


def year_from_filename(stem: str) -> str | None:
    m = YEAR_RE.search(stem)
    if m:
        return m.group(1)
    # handle MM-YY style: "05-24" -> 2024
    m2 = re.search(r"\b(\d{1,2})-(\d{2})\b", stem)
    if m2:
        yy = int(m2.group(2))
        return str(2000 + yy if yy < 80 else 1900 + yy)
    return None


def month_year_from_filename(stem: str) -> tuple[int, int] | None:
    """Extract (year, month) — required for the 7-year/12-month syllabus window.

    AFP filenames use "MM-YY" (e.g., "05-24") or "MM-YYYY" (e.g., "12-2020") right
    before the extension. הר"י filenames sometimes use "MM-YY" too or a leading "YYYY".
    Returns (year, month) if found, else None.
    """
    # MM-YY or MM-YYYY at end
    m = re.search(r"\b(\d{1,2})-(\d{2}|\d{4})\s*$", stem)
    if m:
        mm = int(m.group(1))
        yy = m.group(2)
        year = int(yy) if len(yy) == 4 else (2000 + int(yy) if int(yy) < 80 else 1900 + int(yy))
        if 1 <= mm <= 12:
            return year, mm
    # Fallback: a bare year somewhere — assume mid-year for conservative filtering
    y = YEAR_RE.search(stem)
    if y:
        return int(y.group(1)), 6
    return None


def in_syllabus_window(stem: str, min_ym: tuple[int, int], max_ym: tuple[int, int]) -> bool:
    """True if the paper's filename-date falls in [min_ym, max_ym] inclusive."""
    ym = month_year_from_filename(stem)
    if ym is None:
        # No date we can parse — conservatively include (user can override)
        return True
    return min_ym <= ym <= max_ym


def parse_afp(text: str) -> PaperMeta:
    text = strip_zw(text)
    lines = [ln.rstrip() for ln in text.splitlines()]
    joined = "\n".join(MULTI_WS_RE.sub(" ", ln) for ln in lines)

    citation_m = AFP_CITATION_RE.search(joined)
    citation = citation_m.group(0).strip() if citation_m else None
    if citation:
        citation = re.sub(r"\s+", " ", citation).strip(" .,")

    year = None
    if citation:
        ym = YEAR_RE.search(citation)
        if ym:
            year = ym.group(1)

    # Abstract: paragraph block ending at citation.
    abstract = None
    if citation_m:
        end_idx = citation_m.end()
        start_idx = max(joined.rfind("\n\n", 0, end_idx), 0)
        candidate = joined[start_idx:end_idx].strip()
        candidate_lines = [
            ln
            for ln in candidate.splitlines()
            if not re.match(r"\s*(Author disclosure|CME|Copyright ©|Illustration|Downloaded)", ln)
        ]
        abstract = "\n".join(candidate_lines).strip()
        abstract = re.sub(r" {2,}", " ", abstract)
        if not (120 <= len(abstract) <= 3500):
            abstract = None

    # SORT table. AFP uses a boxed table with header row including "Evidence rating" and "Comments"
    # followed by rows of recommendations and letter grades (A/B/C). It usually sits between the
    # abstract and "EVIDENCE SUMMARY". Capture that span, bounded by those markers.
    sort_block = None
    lower = joined.lower()
    start_markers = ["sort:", "key recommendations for practice", "strength of recommendation"]
    start_idx = -1
    for m in start_markers:
        i = lower.find(m)
        if i >= 0 and (start_idx == -1 or i < start_idx):
            start_idx = i
    if start_idx >= 0:
        end_idx = len(joined)
        # End markers, in preference order: the SORT legend footer, then section headings
        # that appear after the SORT box.
        for m in [
            "aafp.org/afpsort",
            "evidence summary",
            "what's new on this topic",
            "what\u2019s new on this topic",
            "\nintroduction\n",
        ]:
            i = lower.find(m, start_idx + 50)
            if i >= 0:
                end_idx = min(end_idx, i)
        block = joined[start_idx:end_idx].strip()
        # collapse long runs of whitespace and blank lines but keep row breaks
        block = re.sub(r" {2,}", "  ", block)
        block = re.sub(r"\n{3,}", "\n\n", block)
        if 80 <= len(block) <= 5000:
            sort_block = block

    # Opening paragraphs — start AFTER the SORT table if we found one, else after "EVIDENCE SUMMARY".
    body_start = 0
    if sort_block:
        body_start = joined.find(sort_block) + len(sort_block)
    else:
        for marker in ["EVIDENCE SUMMARY", "Evidence Summary"]:
            i = joined.find(marker)
            if i >= 0:
                body_start = i + len(marker)
                break

    body = joined[body_start : body_start + 10000]
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", body) if p.strip()]
    opening = []
    noise_markers = (
        "evidence clinical recommendations",
        "copyright ",
        "copyright\u00a0",
        "downloaded from",
        "downloaded for anonymous",
        "www.aafp.org",
        "american family physician",
        "author disclosure",
        "cme ",
        "for the private, non",
        "for personal use only",
        "all other rights reserved",
        "a = consistent",
        "pci = percutaneous",
    )
    for p in paragraphs:
        p_clean = re.sub(r"\s+", " ", p).strip()
        low = p_clean.lower()
        if any(m in low for m in noise_markers):
            continue
        # Skip author/affiliation lines: lots of comma-separated MD/PhD/MPH patterns
        if re.search(r"\b(MD|PhD|MPH|DO|MS|MSPH)\b.*\b(MD|PhD|MPH|DO|MS|MSPH)\b", p_clean):
            continue
        if 120 <= len(p_clean) <= 1400 and not p_clean.isupper():
            opening.append(p_clean)
        if len(opening) >= 4:
            break

    # PDF title — only a fallback; we prefer the filename title in write_markdown.
    pdf_title = None
    for ln in lines[:20]:
        cleaned = strip_zw(ln).strip().rstrip(":")
        if 10 <= len(cleaned) <= 200 and not cleaned.isupper() and ":" not in cleaned[-3:]:
            pdf_title = cleaned
            break

    return PaperMeta(
        title=pdf_title or "",
        year=year,
        citation=citation,
        abstract=abstract,
        sort_block=sort_block,
        opening_paragraphs=opening,
    )


def parse_hari(text: str) -> PaperMeta:
    lines = [ln.rstrip() for ln in text.splitlines() if ln.strip()]
    head = "\n".join(lines[:80])

    pdf_title = None
    for ln in lines[:10]:
        cleaned = ln.strip()
        # Hebrew title lines usually contain ‫ RTL markers or Hebrew chars
        if 8 <= len(cleaned) <= 250:
            pdf_title = cleaned
            break

    year = None
    ym = YEAR_RE.search(head)
    if ym:
        year = ym.group(1)

    # For Hebrew guidelines there's no reliable "abstract" — take the first substantial paragraph.
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text[:8000]) if p.strip()]
    abstract = None
    opening = []
    for p in paragraphs:
        p_clean = re.sub(r"[ \t]+", " ", p).strip()
        if 150 <= len(p_clean) <= 2000:
            if abstract is None:
                abstract = p_clean
            else:
                opening.append(p_clean)
        if len(opening) >= 4:
            break

    return PaperMeta(
        title=pdf_title or "",
        year=year,
        citation=None,
        abstract=abstract,
        sort_block=None,
        opening_paragraphs=opening,
    )


# ----------------------- markdown writer -----------------------


def yaml_escape(value: str) -> str:
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"') + '"'


def write_markdown(
    md_path: Path,
    kind: str,
    specialty: str,
    pdf_rel: str,
    raw_rel: str,
    filename_title: str,
    filename_year: str | None,
    meta: PaperMeta,
) -> None:
    md_path.parent.mkdir(parents=True, exist_ok=True)
    # Filename is the source of truth for title — pdftotext output is too fragile.
    # Fall back to meta.title only if the filename is empty.
    title = filename_title or meta.title or "Untitled"
    year = meta.year or filename_year or ""
    source = "American Family Physician" if kind == "AFP" else 'הר"י / Israeli Medical Association'
    topic = md_path.parent.name  # AFP or הרי — but we want domain topic; leave blank for now

    fm_lines = [
        "---",
        f"title: {yaml_escape(title)}",
        f"source: {yaml_escape(source)}",
        f"kind: {kind}",
        f"specialty: {yaml_escape(specialty)}",
    ]
    if year:
        fm_lines.append(f"year: {year}")
    if meta.citation:
        fm_lines.append(f"citation: {yaml_escape(meta.citation)}")
    fm_lines.append(f"pdf: {yaml_escape(pdf_rel)}")
    fm_lines.append(f"raw: {yaml_escape(raw_rel)}")
    fm_lines.append("---")

    body = [f"# {title}", ""]
    if meta.citation:
        body.append(f"**Citation:** {meta.citation}")
    elif year:
        body.append(f"**Year:** {year}")
    body.append(f"**Source:** {source}")
    body.append(f"**Specialty:** {specialty}")
    body.append("")

    if meta.abstract:
        body.append("## Abstract" if kind == "AFP" else "## תקציר / Summary")
        body.append("")
        body.append(meta.abstract)
        body.append("")

    if meta.sort_block:
        body.append("## SORT — Key Recommendations")
        body.append("")
        body.append("```")
        body.append(meta.sort_block)
        body.append("```")
        body.append("")

    if meta.opening_paragraphs:
        body.append("## Opening sections")
        body.append("")
        for p in meta.opening_paragraphs:
            body.append(p)
            body.append("")

    body.append("---")
    body.append(f"[📄 Source PDF]({pdf_rel}) | [📝 Full raw text]({raw_rel})")
    body.append("")

    md_path.write_text("\n".join(fm_lines) + "\n\n" + "\n".join(body), encoding="utf-8")


# ----------------------- orchestration -----------------------


@dataclass
class RunStats:
    scanned: int = 0
    extracted: int = 0
    skipped_existing: int = 0
    skipped_out_of_window: int = 0
    failed: list[str] = field(default_factory=list)


def process_pdf(
    pdf: Path,
    specialty: str,
    kind: str,
    force: bool,
    window: tuple[tuple[int, int], tuple[int, int]] | None,
    stats: RunStats,
) -> tuple[str, str] | None:
    """Returns (filename_title, md_rel_path) for the index, or None on failure."""
    stats.scanned += 1
    stem = pdf.stem
    filename_title = clean_title_from_filename(stem)
    filename_year = year_from_filename(stem)

    if window and not in_syllabus_window(stem, window[0], window[1]):
        stats.skipped_out_of_window += 1
        # Self-heal: if an out-of-window stub MD already exists from a prior run,
        # overwrite it with a stub marker so it never gets treated as a real summary.
        md_path = OUT_ROOT / specialty / kind / f"{stem}.md"
        if md_path.exists():
            min_ym, max_ym = window
            stub = (
                "---\n"
                "removed: true\n"
                "reason: out-of-syllabus-window\n"
                f"window: {min_ym[0]:04d}-{min_ym[1]:02d} \u2192 {max_ym[0]:04d}-{max_ym[1]:02d}\n"
                "---\n\n"
                "This paper is **out of the required-reading window** per the "
                "\u05d5\u05e2\u05d3\u05ea \u05d4\u05d1\u05d7\u05d9\u05e0\u05d5\u05ea "
                "\u05d1\u05e8\u05e4\u05d5\u05d0\u05ea \u05d4\u05de\u05e9\u05e4\u05d7\u05d4 "
                "syllabus (7-year rolling window ending 12 months before the exam).\n"
            )
            try:
                md_path.write_text(stub, encoding="utf-8")
            except OSError:
                pass
        return None

    raw_path = RAW_ROOT / specialty / kind / f"{stem}.txt"
    md_path = OUT_ROOT / specialty / kind / f"{stem}.md"

    if md_path.exists() and raw_path.exists() and not force:
        stats.skipped_existing += 1
    else:
        if not pdftotext(pdf, raw_path):
            stats.failed.append(str(pdf.relative_to(ROOT)))
            return None
        try:
            text = raw_path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            stats.failed.append(str(pdf.relative_to(ROOT)))
            return None

        meta = parse_afp(text) if kind == "AFP" else parse_hari(text)

        pdf_rel = os.path.relpath(pdf, md_path.parent)
        raw_rel = os.path.relpath(raw_path, md_path.parent)

        write_markdown(
            md_path=md_path,
            kind=kind,
            specialty=specialty,
            pdf_rel=pdf_rel.replace(os.sep, "/"),
            raw_rel=raw_rel.replace(os.sep, "/"),
            filename_title=filename_title,
            filename_year=filename_year,
            meta=meta,
        )
        stats.extracted += 1

    return filename_title, f"{kind}/{stem}.md"


def write_specialty_index(specialty: str, afp_entries, hari_entries) -> None:
    idx = OUT_ROOT / specialty / "index.md"
    idx.parent.mkdir(parents=True, exist_ok=True)
    lines = [f"# {specialty}", "", f"**{len(afp_entries)} AFP papers · {len(hari_entries)} הר\"י guidelines**", ""]

    if afp_entries:
        lines.append("## AFP — American Family Physician")
        lines.append("")
        for title, rel in sorted(afp_entries):
            lines.append(f"- [{title}]({rel})")
        lines.append("")
    if hari_entries:
        lines.append('## הר"י — Israeli Guidelines')
        lines.append("")
        for title, rel in sorted(hari_entries):
            lines.append(f"- [{title}]({rel})")
        lines.append("")
    idx.write_text("\n".join(lines), encoding="utf-8")


def write_toplevel_readme(
    totals, window: tuple[tuple[int, int], tuple[int, int]] | None, exam_year: int
) -> None:
    out = OUT_ROOT / "README.md"
    total_afp = sum(a for a, _ in totals.values())
    total_hari = sum(h for _, h in totals.values())
    lines = [
        "# AFP & הר\"י — Shlav A reading list (filtered)",
        "",
        f"Extracted summaries for papers on the **רשימת ספרות מחייבת** for שלב א' רפואת משפחה {exam_year}.",
        "",
    ]
    if window:
        (sy, sm), (ey, em) = window
        lines.extend(
            [
                f"**Syllabus window:** {sy}-{sm:02d} → {ey}-{em:02d} "
                f"(7-year rolling window ending 12 months before the {exam_year} exam, "
                "per the ועדת הבחינות ברפואת המשפחה required-reading PDF).",
                "",
            ]
        )
    else:
        lines.append("*(No date filter — all papers included.)*\n")

    lines.extend(
        [
            f"**Totals:** {total_afp} AFP review articles · {total_hari} הר\"י guidelines across {len(totals)} specialties.",
            "",
            "Each paper has:",
            "",
            "- A **committed `.md` summary** (title, citation, abstract, SORT / key recommendations, opening paragraphs)",
            "- A **raw `.txt` dump** in `.raw/` (gitignored — rebuild locally with `python3 scripts/extract_afp_hari.py`)",
            "- A link back to the source PDF",
            "",
            "## Specialties",
            "",
        ]
    )
    for specialty, (n_afp, n_hari) in sorted(totals.items()):
        slug = specialty.replace("/", "_")
        lines.append(f"- [{specialty}]({slug}/index.md) — {n_afp} AFP · {n_hari} הר\"י")
    lines.extend(
        [
            "",
            "## Re-running the pipeline",
            "",
            "```bash",
            "python3 scripts/extract_afp_hari.py                 # syllabus window (default, 2026 exam)",
            "python3 scripts/extract_afp_hari.py --exam-year 2027  # shift window one year",
            "python3 scripts/extract_afp_hari.py --all-years       # no date filter",
            "python3 scripts/extract_afp_hari.py --force           # rebuild everything",
            "```",
            "",
            "Requires `pdftotext` (poppler-utils) on PATH.",
            "",
        ]
    )
    out.write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=None, help="Max PDFs per specialty (smoke test)")
    ap.add_argument("--force", action="store_true", help="Rewrite even if md already exists")
    ap.add_argument("--only", help="Process only this specialty (Hebrew folder name)")
    ap.add_argument(
        "--exam-year",
        type=int,
        default=2026,
        help="Shlav A exam year (default 2026). Window = 7 years ending 12 months before exam.",
    )
    ap.add_argument("--all-years", action="store_true", help="Skip the syllabus date filter")
    args = ap.parse_args()

    # Syllabus window: 7-year window ending 12 months before the exam.
    # Per the official required-reading PDF: for Shlav A 2026, range is 2018-06 → 2025-05.
    window: tuple[tuple[int, int], tuple[int, int]] | None = None
    if not args.all_years:
        # Per the PDF: "for Shlav A 2026 → 2018-06-01 to 2025-05-31" (84-month window).
        end_year = args.exam_year - 1
        end_month = 5
        start_year = end_year - 7
        start_month = 6
        window = ((start_year, start_month), (end_year, end_month))

    stats = RunStats()
    totals: dict[str, tuple[int, int]] = {}

    for specialty in SPECIALTIES:
        if args.only and specialty != args.only:
            continue
        spec_dir = ROOT / specialty
        if not spec_dir.is_dir():
            continue

        afp_entries: list[tuple[str, str]] = []
        hari_entries: list[tuple[str, str]] = []

        for folder_name, kind in KIND_FOLDERS.items():
            kdir = spec_dir / folder_name
            if not kdir.is_dir():
                continue
            pdfs = sorted(kdir.glob("*.pdf"))
            if args.limit:
                pdfs = pdfs[: args.limit]
            for pdf in pdfs:
                result = process_pdf(pdf, specialty, kind, args.force, window, stats)
                if result:
                    title, rel = result
                    (afp_entries if kind == "AFP" else hari_entries).append((title, rel))

        if afp_entries or hari_entries:
            write_specialty_index(specialty, afp_entries, hari_entries)
            totals[specialty] = (len(afp_entries), len(hari_entries))

    if totals:
        write_toplevel_readme(totals, window, args.exam_year)

    win_str = f"{window[0][0]}-{window[0][1]:02d} → {window[1][0]}-{window[1][1]:02d}" if window else "none"
    print(
        f"scanned={stats.scanned}  extracted={stats.extracted}  "
        f"skipped_out_of_window={stats.skipped_out_of_window}  "
        f"skipped_existing={stats.skipped_existing}  failed={len(stats.failed)}  "
        f"window={win_str}"
    )
    if stats.failed:
        print("FAILED:")
        for f in stats.failed:
            print(f"  - {f}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
