#!/usr/bin/env python3
"""
ingest_session.py — Full pipeline: parse exam PDF + merge answer key + classify topic + generate explanation.

Produces canonical JSON entries ready to append to data/questions.json.

Usage:
    python3 ingest_session.py <session_tag> <q_pdf> <answer_key_json> [--limit N] [--parallel N]

Output: exams/answer_keys/<session_tag>_canonical.json
        {questions: [{q, o, c, c_accept, t, ti, e, st}]}
"""
import os, sys, json, re, time, argparse
import urllib.request
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.path.insert(0, str(Path(__file__).parent))
from parse_questions import parse_exam

API_KEY = os.environ.get('ANTHROPIC_API_KEY')
MODEL = 'claude-sonnet-4-5'
ENDPOINT = 'https://api.anthropic.com/v1/messages'

# Mishpacha 27 topics (0-indexed; matches src/core/constants.js TOPICS array)
TOPICS = [
    "Adult Cardiology — IHD & Arrhythmia (angina, MI, AF, SVT, VT, bradycardia, syncope-cardiac)",
    "Heart Failure & Valves (HFrEF, HFpEF, AS, MR, endocarditis)",
    "Hypertension & Lipids (HTN, dyslipidemia, statin, ASCVD risk)",
    "Pulmonology (Asthma, COPD, PE, pneumothorax, interstitial lung, sleep apnea)",
    "Gastroenterology & Hepatology (GERD, PUD, IBS, IBD, hepatitis, liver, pancreatitis, GI bleed)",
    "Nephrology, UTI & Urology (CKD, AKI, UTI, stones, hematuria, electrolytes except Ca, BPH-work-up-only)",
    "Endocrinology — Diabetes (T1DM, T2DM, DKA, HHS, gestational DM, prediabetes, diabetic complications)",
    "Endocrinology — Thyroid & Other (hypo/hyperthyroidism, nodules, PTH/calcium/osteoporosis-metabolic, adrenal, pituitary, obesity-metabolic)",
    "Hematology & Coagulation (anemia, thrombocytopenia, leukemia, lymphoma, DVT/PE-work-up, anticoagulation)",
    "Rheumatology & Musculoskeletal (OA, RA, gout, fibromyalgia, LBP, shoulder, knee, sports injuries)",
    "Neurology (Stroke, Headache, Dementia, seizure, Parkinson, vertigo, neuropathy, MS)",
    "Dermatology (rash, eczema, psoriasis, acne, rosacea, skin cancer, infections-skin)",
    "Allergy & Immunology (rhinitis, anaphylaxis, food allergy, drug allergy, urticaria)",
    "Infectious Disease & Vaccines (Adult) (adult vax, sexually transmitted, travel med, TB, HIV, non-peds infections)",
    "Women's Health & Gynecology (menses, PCOS, contraception, menopause, breast, pelvic pain, non-pregnant)",
    "Pregnancy, Perinatal & Postpartum (antenatal, gestational conditions, postpartum, lactation)",
    "Men's Health (ED, prostate cancer, BPH-management, testosterone, scrotal)",
    "Geriatrics (Falls, Cognition, Polypharmacy, frailty, incontinence, driving)",
    "Mental Health — Mood, Anxiety, Psychosis (depression, anxiety, bipolar, OCD, PTSD, schizophrenia, suicide)",
    "Addictions & Lifestyle Behaviors (smoking, alcohol, opioids, exercise counseling, nutrition-behavioral)",
    "Preventive Medicine & Health Promotion (screening — cancer/cardio, vaccines-context-only-if-program, USPSTF)",
    "Pain, Palliative & End-of-Life (chronic pain, opioid Rx, palliative, EOL, advance directives)",
    "Emergencies in the Clinic (anaphylaxis-management, chest pain triage, acute abdomen triage, CPR, ACLS)",
    "Peds — Newborn & Development (neonatal, milestones, well-baby, feeding, growth)",
    "Peds — Acute & Infections (peds infections, otitis, pharyngitis, bronchiolitis, peds fever/rash)",
    "Peds — Adolescent & Mental Health (adolescent preventive, peds behavioral/mental, peds chronic)",
    "EBM, Communication & Family Systems (stats, study design, doctor-patient, bad news, legal duties, family dynamics, ethics)",
]

TOPICS_MENU = "\n".join(f"{i}. {t}" for i, t in enumerate(TOPICS))


def anthropic_call(system: str, user: str, max_tokens: int = 1200, temperature: float = 0.0, retries: int = 3):
    """POST to Anthropic messages API, return text."""
    body = json.dumps({
        "model": MODEL,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "system": system,
        "messages": [{"role": "user", "content": user}],
    }).encode("utf-8")
    req = urllib.request.Request(
        ENDPOINT,
        data=body,
        headers={
            "x-api-key": API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        method="POST",
    )
    last_err = None
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                parts = [b.get("text", "") for b in data.get("content", []) if b.get("type") == "text"]
                return "".join(parts)
        except Exception as e:
            last_err = e
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"Anthropic call failed after {retries}: {last_err}")


def parse_json_from_response(text: str):
    """Extract first JSON object from response."""
    text = text.strip()
    # Strip code fences
    text = re.sub(r'^```(?:json)?\s*', '', text)
    text = re.sub(r'\s*```\s*$', '', text)
    # Find first { or [
    start = min((text.find('{'), text.find('[')), key=lambda x: x if x >= 0 else 10**9)
    if start < 0:
        raise ValueError(f"No JSON found in response: {text[:200]}")
    # Try parsing from there
    try:
        return json.loads(text[start:])
    except json.JSONDecodeError:
        # Try stripping trailing commentary
        for end in range(len(text), start, -1):
            try:
                return json.loads(text[start:end])
            except json.JSONDecodeError:
                continue
        raise


def classify_and_explain(qnum: int, q: str, opts: list, correct_idx: int, session: str):
    """Ask Sonnet to assign ti (0-26) + generate 2-3 sentence Hebrew explanation."""
    correct_letter_map = {0: 'א', 1: 'ב', 2: 'ג', 3: 'ד'}
    correct_letter = correct_letter_map[correct_idx]
    options_block = "\n".join(f"{correct_letter_map[i]}. {o}" for i, o in enumerate(opts))

    system = (
        "You are helping curate an Israeli Family Medicine Shlav A board exam prep app. "
        "For each question, output strict JSON: {\"ti\": <0-26>, \"e\": \"<2-3 sentence Hebrew explanation>\"}. "
        "\n\nti MUST be the single best-fit topic index from this menu:\n" + TOPICS_MENU +
        "\n\nThe explanation MUST be in Hebrew (clinical language OK for English drug/condition names). "
        "It should (1) name the correct answer, (2) give the key teaching point, (3) briefly say why other plausible distractors are wrong if relevant. "
        "Target 40–80 Hebrew words. No markdown. No preamble. Output JSON ONLY."
    )
    user = (
        f"Q{qnum} ({session}):\n\n"
        f"{q}\n\n{options_block}\n\n"
        f"Correct answer: {correct_letter}\n\n"
        "Output JSON now:"
    )
    raw = anthropic_call(system, user, max_tokens=500, temperature=0.0)
    obj = parse_json_from_response(raw)
    ti = int(obj.get("ti", 0))
    if not (0 <= ti <= 26):
        raise ValueError(f"ti out of range: {ti}")
    e = obj.get("e", "").strip()
    if len(e) < 20:
        raise ValueError(f"explanation too short: {e!r}")
    return ti, e


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("session_tag", help="e.g., 2025-Jun")
    ap.add_argument("q_pdf", help="path to question PDF")
    ap.add_argument("answer_key_json", help="path to answer_keys/<session>.json")
    ap.add_argument("--limit", type=int, default=None, help="limit Qs for testing")
    ap.add_argument("--parallel", type=int, default=10)
    ap.add_argument("--out", default=None, help="output path (default: exams/answer_keys/<tag>_canonical.json)")
    args = ap.parse_args()

    if not API_KEY:
        print("ERROR: set ANTHROPIC_API_KEY", file=sys.stderr)
        sys.exit(1)

    # 1. Parse questions
    print(f"[1/3] Parsing {args.q_pdf} ...")
    qs_parsed, stats = parse_exam(args.q_pdf)
    print(f"      parsed={len(qs_parsed)} full_opts={stats['with_full_options']}")

    # 2. Load answer key
    ak = json.load(open(args.answer_key_json))
    answers = ak["answers"]
    print(f"[2/3] Loaded {len(answers)} answers from {args.answer_key_json}")

    # 3. Build entries
    entries = []
    nums_to_process = sorted([int(n) for n in answers.keys()])
    if args.limit:
        nums_to_process = nums_to_process[:args.limit]

    missing_in_parse = []
    for n in nums_to_process:
        q_obj = qs_parsed.get(n) or qs_parsed.get(str(n))
        if not q_obj or q_obj.get("n_options") != 4:
            missing_in_parse.append(n)
            continue
        accept = answers[str(n)]
        # Validate
        if not accept or not all(0 <= i <= 3 for i in accept):
            print(f"  skip Q{n}: bad answer key {accept}")
            continue
        entries.append({
            "n": n,
            "q": q_obj["q"],
            "o": q_obj["o"],
            "c": accept[0],  # primary = first accepted
            "c_accept": accept,
            "t": args.session_tag,
            "st": None,  # stage/subspec — None for Mishpacha
            "ti": None,  # fill via Sonnet
            "e": None,   # fill via Sonnet
        })

    print(f"      ready to classify+explain: {len(entries)} Qs  (missing_in_parse: {missing_in_parse[:20]})")

    # 4. Sonnet classify + explain (parallel)
    print(f"[3/3] Sonnet classify+explain (parallel={args.parallel}) ...")
    start = time.time()

    def worker(e):
        try:
            ti, expl = classify_and_explain(e["n"], e["q"], e["o"], e["c"], args.session_tag)
            e["ti"] = ti
            e["e"] = expl
            return True, e["n"], None
        except Exception as ex:
            return False, e["n"], str(ex)

    done = 0
    errors = []
    with ThreadPoolExecutor(max_workers=args.parallel) as ex:
        futs = [ex.submit(worker, e) for e in entries]
        for f in as_completed(futs):
            ok, n, err = f.result()
            done += 1
            if not ok:
                errors.append((n, err))
            if done % 10 == 0:
                elapsed = time.time() - start
                print(f"      {done}/{len(entries)} done in {elapsed:.1f}s  errors={len(errors)}")

    elapsed = time.time() - start
    print(f"      final: {done}/{len(entries)} in {elapsed:.1f}s  errors={len(errors)}")
    if errors:
        print(f"      first 5 errors: {errors[:5]}")

    # 5. Emit final entries (drop failed)
    final = [e for e in entries if e.get("ti") is not None and e.get("e")]
    # Strip 'n' field from output (internal only)
    output = {
        "session": args.session_tag,
        "count": len(final),
        "missing_in_parse": missing_in_parse,
        "errors_in_classify": [n for n, _ in errors],
        "questions": [
            {k: v for k, v in e.items() if k != "n"}
            for e in final
        ],
    }
    out_path = args.out or f"exams/answer_keys/{args.session_tag.replace('-','_')}_canonical.json"
    Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=1)
    print(f"\n✅ Wrote {len(final)} canonical entries to {out_path}")


if __name__ == "__main__":
    main()
