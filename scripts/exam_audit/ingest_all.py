#!/usr/bin/env python3
"""
ingest_all.py — Orchestrate ingestion of all 5 remaining exam sessions.

For each session: run ingest_session.py (parse + classify + explain) unless the
canonical JSON already exists. Then merge all canonical entries with the
existing data/questions.json (150 Qs from 2025-Jun) into one master file.

Expected result: ~788 Qs (150 existing + ~638 new across 5 sessions).

Usage:
    export ANTHROPIC_API_KEY=sk-ant-...
    python3 scripts/exam_audit/ingest_all.py [--parallel 10] [--dry-run]

Idempotent: re-running skips sessions whose canonical JSON already exists.
Delete a canonical file to re-ingest that session.
"""
import os
import sys
import json
import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPT_DIR = Path(__file__).resolve().parent
INGEST_SESSION = SCRIPT_DIR / "ingest_session.py"
QUESTIONS_JSON = REPO_ROOT / "data" / "questions.json"
ANSWER_KEYS_DIR = REPO_ROOT / "exams" / "answer_keys"
EXAMS_DIR = REPO_ROOT / "exams"

# (session_tag, questions_pdf, answer_key_json)
# NOTE: the 2024-Sep exam's questions PDF is named 2024_oct_questions.pdf in the
# repo (historical rename). Answer key file is 2024_Sep.json and count=100.
SESSIONS = [
    ("2021-Jun", EXAMS_DIR / "2021_jun_questions.pdf", ANSWER_KEYS_DIR / "2021_Jun.json"),
    ("2022-Jun", EXAMS_DIR / "2022_jun_questions.pdf", ANSWER_KEYS_DIR / "2022_Jun.json"),
    ("2023-Jun", EXAMS_DIR / "2023_jun_questions.pdf", ANSWER_KEYS_DIR / "2023_Jun.json"),
    ("2024-May", EXAMS_DIR / "2024_may_questions.pdf", ANSWER_KEYS_DIR / "2024_May.json"),
    ("2024-Sep", EXAMS_DIR / "2024_oct_questions.pdf", ANSWER_KEYS_DIR / "2024_Sep.json"),
]

TAG_WHITELIST = {
    "2020", "2021-Jun", "2022-Jun", "2023-Jun",
    "2024-May", "2024-Sep", "2025-Jun",
    "Goroll", "Nelson", "AFP", "Exam",
}


def canonical_path(tag: str) -> Path:
    return ANSWER_KEYS_DIR / f"{tag.replace('-', '_')}_canonical.json"


def run_session(tag: str, q_pdf: Path, ak_json: Path, parallel: int) -> dict:
    """Run ingest_session.py for one session. Returns summary dict."""
    out = canonical_path(tag)
    if out.exists():
        print(f"[skip] {tag}: {out.name} already exists")
        return {"tag": tag, "skipped": True, "out": str(out)}

    if not q_pdf.exists():
        return {"tag": tag, "skipped": False, "error": f"missing pdf: {q_pdf}"}
    if not ak_json.exists():
        return {"tag": tag, "skipped": False, "error": f"missing answer key: {ak_json}"}

    print(f"\n{'=' * 60}\n[run ] {tag}\n{'=' * 60}")
    cmd = [
        sys.executable,
        str(INGEST_SESSION),
        tag,
        str(q_pdf),
        str(ak_json),
        "--parallel", str(parallel),
        "--out", str(out),
    ]
    try:
        subprocess.run(cmd, check=True, cwd=str(REPO_ROOT))
    except subprocess.CalledProcessError as e:
        return {"tag": tag, "skipped": False, "error": f"ingest_session exited {e.returncode}"}
    return {"tag": tag, "skipped": False, "out": str(out)}


def load_canonical(path: Path) -> list:
    """Load canonical JSON; return list of question dicts."""
    if not path.exists():
        return []
    d = json.load(open(path, encoding="utf-8"))
    return d.get("questions", [])


def validate_questions(qs: list) -> list:
    """Validate every Q; return list of error strings (empty = all good)."""
    errs = []
    for i, q in enumerate(qs):
        required = ["q", "o", "c", "c_accept", "t", "ti", "e", "st"]
        for k in required:
            if k not in q:
                errs.append(f"Q[{i}] missing key '{k}'")
                break
        if errs and errs[-1].startswith(f"Q[{i}]"):
            continue
        if not isinstance(q["o"], list) or len(q["o"]) != 4:
            errs.append(f"Q[{i}] options not length 4: got {len(q.get('o', []))}")
            continue
        if not isinstance(q["c"], int) or not (0 <= q["c"] <= 3):
            errs.append(f"Q[{i}] c not int 0..3: {q['c']}")
            continue
        if not isinstance(q["c_accept"], list) or q["c"] not in q["c_accept"]:
            errs.append(f"Q[{i}] c not in c_accept: c={q['c']} accept={q['c_accept']}")
            continue
        if q["t"] not in TAG_WHITELIST:
            errs.append(f"Q[{i}] tag '{q['t']}' not in whitelist")
            continue
        if not isinstance(q["ti"], int) or not (0 <= q["ti"] <= 26):
            errs.append(f"Q[{i}] ti not 0..26: {q['ti']}")
            continue
        if not isinstance(q["e"], str) or len(q["e"]) < 20:
            errs.append(f"Q[{i}] explanation <20 chars: {q.get('e','')[:40]!r}")
            continue
    return errs


def main():
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--parallel", type=int, default=10)
    ap.add_argument("--dry-run", action="store_true",
                    help="skip running ingest_session; only merge what's already canonical")
    args = ap.parse_args()

    if not os.environ.get("ANTHROPIC_API_KEY") and not args.dry_run:
        print("ERROR: ANTHROPIC_API_KEY not set", file=sys.stderr)
        sys.exit(1)

    # 1. Run each session (or skip if canonical exists)
    results = []
    for tag, q_pdf, ak_json in SESSIONS:
        if args.dry_run:
            out = canonical_path(tag)
            results.append({"tag": tag, "skipped": out.exists(), "out": str(out)})
        else:
            results.append(run_session(tag, q_pdf, ak_json, args.parallel))

    # 2. Print session summary
    print(f"\n{'=' * 60}\nSESSION SUMMARY\n{'=' * 60}")
    for r in results:
        if r.get("error"):
            print(f"  {r['tag']}: ERROR — {r['error']}")
        elif r["skipped"]:
            print(f"  {r['tag']}: skipped (canonical exists)")
        else:
            print(f"  {r['tag']}: ingested → {Path(r['out']).name}")

    # 3. Load existing questions.json (150 from 2025-Jun)
    existing = json.load(open(QUESTIONS_JSON, encoding="utf-8"))
    print(f"\nExisting {QUESTIONS_JSON.name}: {len(existing)} Qs")

    # Heal legacy records: add c_accept=[c] where missing (pre-existing issue in 2025-Jun)
    healed = 0
    for q in existing:
        if "c_accept" not in q and isinstance(q.get("c"), int):
            q["c_accept"] = [q["c"]]
            healed += 1
    if healed:
        print(f"  [heal] added c_accept=[c] to {healed} legacy records")

    # Collect existing tags so we don't double-merge
    existing_tags = set(q.get("t") for q in existing)

    # 4. Merge canonical files for sessions not already in existing
    new_qs = []
    per_session_counts = {}
    for tag, _, _ in SESSIONS:
        canon = canonical_path(tag)
        if not canon.exists():
            print(f"  [warn] no canonical for {tag}, skipping merge")
            continue
        qs = load_canonical(canon)
        if tag in existing_tags:
            print(f"  [skip merge] {tag} already present in {QUESTIONS_JSON.name}")
            continue
        new_qs.extend(qs)
        per_session_counts[tag] = len(qs)

    print(f"\nNew Qs to merge: {len(new_qs)} across {len(per_session_counts)} sessions")
    for tag, n in per_session_counts.items():
        print(f"  {tag}: {n}")

    merged = existing + new_qs
    print(f"\nTotal after merge: {len(merged)} Qs")

    # 5. Validate
    errs = validate_questions(merged)
    if errs:
        print(f"\n❌ {len(errs)} validation errors:")
        for e in errs[:20]:
            print(f"  {e}")
        if len(errs) > 20:
            print(f"  ... +{len(errs) - 20} more")
        sys.exit(2)

    # 6. Write (only if we actually merged new Qs)
    if new_qs:
        with open(QUESTIONS_JSON, "w", encoding="utf-8") as f:
            json.dump(merged, f, ensure_ascii=False, indent=1)
        print(f"\n✅ Wrote {len(merged)} Qs to {QUESTIONS_JSON}")
    else:
        print(f"\n(no new Qs merged — {QUESTIONS_JSON} unchanged)")

    # 7. Final tag summary
    tag_counts = {}
    for q in merged:
        tag_counts[q["t"]] = tag_counts.get(q["t"], 0) + 1
    print("\nPer-tag counts:")
    for t in sorted(tag_counts):
        print(f"  {t}: {tag_counts[t]}")


if __name__ == "__main__":
    main()
