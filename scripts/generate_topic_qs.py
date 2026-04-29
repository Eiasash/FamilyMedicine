#!/usr/bin/env python3
"""Generate FM-Core MCQs for low-volume Mishpacha buckets via toranot proxy.
Mirrors Shlav A v10.30 generate_topic_qs.py pattern but adapted for FM schema:
- Plain string options (no א./ב./ג./ד. prefix)
- c_accept field required
- st=None
- t='FM-Core'
- ti in 0..26
- canonical write: json.dump(d, f, ensure_ascii=False, indent=2)

Targets: ti=1 HF&Valves, ti=12 Allergy, ti=16 Men's Health, ti=19 Addictions, ti=21 Pain/Pall
"""
import json, sys, time, concurrent.futures, urllib.request, urllib.error, re

PROXY = "https://toranot.netlify.app/api/claude"
SECRET = "shlav-a-mega-1f97f311d307-2026"
QS_PATH = "data/questions.json"

BUCKETS = {
    1: {
        "name": "Heart Failure & Valves (FM-Core)",
        "n": 11,
        "topics": [
            "HFrEF (EF≤40%) GDMT 4-pillar (ARNI/ACEi+βB+MRA+SGLT2i): start all 4 in parallel rather than sequential, titrate over 4-8 weeks (PARADIGM-HF, DAPA-HF, EMPEROR-Reduced)",
            "HFpEF (EF≥50%) treatment: SGLT2i (empagliflozin/dapagliflozin) is class I (EMPEROR-Preserved/DELIVER), diuretics for congestion; ACEi/ARB role limited",
            "BNP/NT-proBNP rule-out thresholds: NT-proBNP <300 pg/mL excludes acute HF; BNP <100 pg/mL same; obesity lowers values, AF and renal failure raise them",
            "Furosemide IV vs oral: oral bioavailability ~50%, so 40 mg IV ≈ 80 mg PO; switch to IV in acute decompensation",
            "Aortic stenosis severity: severe = mean gradient >40 mmHg, peak velocity >4 m/s, AVA <1 cm²; symptomatic severe AS → AVR/TAVR",
            "Mitral regurgitation grading: severe = regurgitant volume >60 mL, ERO >40 mm²; primary MR (organic) treated surgically when symptomatic or LVEF <60%",
            "Atrial fibrillation in HF: rate control (βB or digoxin); rhythm control if symptomatic despite rate control (CASTLE-AF supports ablation in HFrEF)",
            "Valve replacement antithrombotic: mechanical = lifelong warfarin (INR 2.5-3.5 mitral, 2-3 aortic); bioprosthetic = 3 months warfarin then aspirin",
            "ARNI (sacubitril/valsartan) initiation: 36-hour washout from ACEi to avoid angioedema; start 24/26 mg BID, titrate q2-4 weeks",
            "Diuretic resistance in HF: combine loop + thiazide (metolazone or HCTZ) for sequential nephron blockade — monitor K+ and renal function closely",
            "Mitral stenosis in pregnancy: rheumatic etiology common in immigrant populations; βB for rate control, balloon valvuloplasty if severe symptomatic",
        ],
    },
    12: {
        "name": "Allergy & Immunology (FM-Core)",
        "n": 11,
        "topics": [
            "Anaphylaxis treatment: IM epinephrine 0.3-0.5 mg lateral thigh (1:1000), repeat q5-15min PRN; H1+H2 blockers and steroids are SECONDARY adjuncts not first-line",
            "Allergic rhinitis stepwise: intranasal corticosteroid (mometasone/fluticasone) is FIRST-LINE; add 2nd-gen oral antihistamine (cetirizine/loratadine/desloratadine) for breakthrough",
            "Penicillin allergy delabeling: low-risk reactions (childhood rash, GI upset, family-only history) — direct oral amoxicillin challenge in clinic; avoids unnecessary broad-spectrum ABX",
            "Food allergy diagnosis: history > IgE/skin testing (positive predictive value ~50%); oral food challenge is gold standard; component-resolved diagnostics (Ara h 2 for peanut) improve specificity",
            "Atopic dermatitis stepwise: emollients + low-potency topical steroid (hydrocortisone 1%) for face/folds, mid-potency for trunk; topical calcineurin inhibitors (tacrolimus) for steroid-sparing",
            "Angioedema differential: histaminergic (urticaria + pruritus, responds to antihistamine/epi) vs bradykinin-mediated (HAE/ACEi-induced — no urticaria, no response to epi/antihistamine; needs C1-INH or icatibant)",
            "Common Variable Immunodeficiency (CVID): adult onset, recurrent sinopulmonary infections, low IgG/IgA±IgM; treat with IVIG; suspect when patient has >2 pneumonias/year",
            "Drug allergy vs intolerance: true IgE-mediated allergy = urticaria/anaphylaxis within 1 hour; statin myalgia, ACEi cough, opioid nausea are intolerances NOT allergies",
            "Latex allergy: cross-reactivity with banana/avocado/kiwi/chestnut (latex-fruit syndrome); avoid in healthcare workers + spina bifida patients",
            "Asthma + aspirin sensitivity (Samter's triad): asthma + nasal polyps + NSAID hypersensitivity; AERD — leukotriene modifiers (montelukast) help, aspirin desensitization for severe cases",
            "Allergy testing in primary care: serum specific IgE (ImmunoCAP) — useful when skin prick contraindicated (severe eczema, anaphylaxis history, antihistamine use); negative result has high NPV",
        ],
    },
    16: {
        "name": "Men's Health (FM-Core)",
        "n": 11,
        "topics": [
            "BPH first-line medical therapy: alpha-blocker (tamsulosin/silodosin) for symptom relief in 1-2 weeks; 5-alpha reductase inhibitor (finasteride/dutasteride) for prostate >40g, takes 6 months",
            "Erectile dysfunction workup: history of vascular risk factors first (diabetes, HTN, smoking); morning testosterone if low libido; PDE5 inhibitor (sildenafil/tadalafil) is first-line if no nitrate use",
            "PSA screening (USPSTF 2018): shared decision-making 55-69 (Grade C); do not screen ≥70 (Grade D); avoid in life expectancy <10 years",
            "Testicular cancer red flags: painless testicular mass in young man (15-35); trans-scrotal U/S first; do NOT do trans-scrotal biopsy (seeds tumor); refer to urology for inguinal orchiectomy",
            "Acute prostatitis: febrile, dysuria, perineal pain, tender boggy prostate on exam — DO NOT massage (bacteremia risk); empiric ciprofloxacin or TMP-SMX 4-6 weeks",
            "Varicocele: 'bag of worms' on standing exam, left-sided 90% (left renal vein anatomy); refer if pain/atrophy/infertility; right-sided new varicocele warrants imaging (renal mass)",
            "Premature ejaculation: SSRIs (paroxetine, sertraline) on-demand or daily; topical lidocaine/prilocaine; behavioral therapy (squeeze technique)",
            "Testosterone replacement (TRT) caveats: contraindications include prostate cancer, breast cancer, untreated severe OSA, Hct >50%; monitor PSA + Hct + total T at 3 and 6 months",
            "Hydrocele vs hernia: transilluminates (hydrocele) vs not (hernia or tumor); reducibility test; U/S if uncertain",
            "Phimosis vs paraphimosis: phimosis = foreskin can't retract (often physiologic until age 5); paraphimosis = retracted foreskin can't reduce (urological emergency — manual reduction or dorsal slit)",
            "Male infertility workup: semen analysis x2 (4-week interval) — concentration <15 million/mL, motility <40%, morphology <4% normal forms; refer to urology",
        ],
    },
    19: {
        "name": "Addictions & Lifestyle Behaviors (FM-Core)",
        "n": 11,
        "topics": [
            "Alcohol use disorder pharmacotherapy: naltrexone 50 mg PO daily (first-line, reduces craving + heavy drinking days); acamprosate (post-detox abstinence support); disulfiram (only for highly motivated)",
            "Smoking cessation: combination NRT (long-acting patch + short-acting gum/lozenge) is more effective than monotherapy; varenicline (Champix) has highest efficacy; bupropion as alternative",
            "Opioid use disorder: buprenorphine/naloxone (Suboxone) — start when in moderate withdrawal (COWS ≥8) to avoid precipitated withdrawal; methadone available only via licensed clinics",
            "Alcohol withdrawal severity: CIWA-Ar score guides treatment; mild = symptom-triggered benzodiazepines; severe (delirium tremens, seizures) = scheduled lorazepam/diazepam, thiamine 100 mg IV BEFORE glucose to prevent Wernicke's",
            "Cannabis use disorder: most prevalent illicit drug; no FDA-approved pharmacotherapy; CBT and motivational interviewing first-line; consider quetiapine for cannabis-induced psychosis",
            "Stimulant use disorder (cocaine/meth): no FDA-approved pharmacotherapy; contingency management is most evidence-based; treat comorbid depression/ADHD",
            "Benzodiazepine taper: reduce by 10-25% every 2-4 weeks; switch to long-acting (diazepam) to ease taper; gabapentin or carbamazepine adjunct for severe withdrawal",
            "Tobacco screening (USPSTF Grade A): ask all adults at every visit; brief counseling + pharmacotherapy; e-cigarettes — insufficient evidence as cessation aid (USPSTF 2021 'I' statement)",
            "AUDIT-C screening: 3 questions; ≥4 (men) or ≥3 (women) = positive screen; brief intervention reduces drinking 13-34%",
            "Gambling disorder: now classified with substance use disorders in DSM-5; CBT first-line; naltrexone/SSRI for severe cases; financial harm assessment",
            "Physical activity counseling: USPSTF 2022 — recommend behavioral counseling for adults with CV risk factors (Grade B); 150 min/week moderate or 75 min/week vigorous + 2 sessions strength training",
        ],
    },
    21: {
        "name": "Pain, Palliative & End-of-Life (FM-Core)",
        "n": 11,
        "topics": [
            "WHO analgesic ladder (modified): mild pain = paracetamol/NSAID; moderate = add weak opioid (codeine/tramadol); severe = strong opioid (morphine, oxycodone, fentanyl). Adjuvants (gabapentinoids, TCAs) at any step for neuropathic pain",
            "Opioid conversion: morphine 30 mg PO ≈ 10 mg IV ≈ oxycodone 20 mg PO ≈ hydromorphone 7.5 mg PO; reduce by 25-50% for incomplete cross-tolerance when switching",
            "Cancer pain breakthrough dosing: 10-20% of total daily opioid dose, prn q1-4h; if needing >3-4 breakthrough doses/day, increase scheduled dose by 25-50%",
            "Neuropathic pain first-line: gabapentin (titrate 100→300→600 mg TID) or pregabalin; TCAs (amitriptyline) for nighttime; duloxetine for diabetic neuropathy",
            "Constipation prevention with opioids: start senna ± docusate WITH any opioid prescription, not after symptoms; methylnaltrexone for opioid-induced constipation refractory to laxatives",
            "Hospice eligibility (US Medicare): prognosis ≤6 months if disease follows usual course; patient consents to comfort-focused care; not synonymous with stopping all treatments",
            "Dyspnea in advanced disease: low-dose oral morphine (2.5-5 mg) reduces sensation of breathlessness; oxygen only helps if hypoxic; fan to face is evidence-based non-pharm option",
            "Death rattle (terminal secretions): glycopyrrolate (less CNS effect) or hyoscine butylbromide; positioning; family education that patient is not 'drowning' or distressed",
            "Bereavement screening: PHQ-9 at 2 and 6 months post-loss; complicated grief if persistent functional impairment >6-12 months; refer for therapy",
            "ייפוי כוח מתמשך (Israel — תיקון 18 לחוק הכשרות המשפטית): allows competent adult to designate decision-makers for future incapacity; covers medical, financial, personal matters",
            "Palliative care in non-cancer disease: indicated for advanced HF (NYHA III-IV), COPD (GOLD D + frequent exacerbations), ESRD, advanced dementia (FAST 7); not just oncology",
        ],
    },
}

PROMPT = """אתה מחבר שאלות לבחינת מועצה ברפואת המשפחה בישראל (IMA P0062-2025).

נושא: {bucket_name}
פוקוס ספציפי לשאלה זו: {topic}

צור שאלה אחת מסוג case-based MCQ בעברית רהוטה ברמת בחינה.

דרישות פורמט (חובה):
- שאלה (q): וניאט קליני בן 1-3 משפטים, 80-280 תווים, כולל גיל המטופל ופרט עיקרי. סיים בשאלה ברורה.
- 4 אופציות (o): מערך של 4 מחרוזות פשוטות, ללא תגי א/ב/ג/ד מקדמיים. כל אחת באורך 15-100 תווים. שלוש מסיחים סבירים, אחת תשובה נכונה.
- אינדקס נכון (c): 0, 1, 2, או 3
- הסבר (e): 250-450 תווים בעברית. הסבר למה התשובה הנכונה נכונה ולמה לפחות שתי אחרות שגויות. כלול ציטוט/מקור (USPSTF, ACOG, AAFP, אגודת הקרדיולוגים, NEJM, Cochrane וכו').

כללים:
- אל תשתמש ב-markdown (**) או חיצים (←→↑↓)
- אם אינך בטוח בעובדה — החזר {{"skip": true, "why": "..."}}

החזר JSON אחד בלבד (ללא code fences, ללא טקסט נוסף):
{{"q": "...", "o": ["opt1", "opt2", "opt3", "opt4"], "c": 0-3, "e": "..."}}"""


def gen_one(bucket_ti, topic_idx, topic, bucket_meta):
    """One generation call with retry on 5xx (proxy can flap under load)."""
    prompt = PROMPT.format(bucket_name=bucket_meta["name"], topic=topic)
    body = json.dumps({
        "model": "sonnet", "max_tokens": 1500,
        "messages": [{"role": "user", "content": prompt}]
    }).encode()
    last_err = None
    for attempt in range(5):  # up to 5 tries with exp backoff
        try:
            req = urllib.request.Request(PROXY, data=body,
                headers={"x-api-secret": SECRET, "content-type": "application/json"})
            with urllib.request.urlopen(req, timeout=30) as r:
                data = json.loads(r.read().decode())
            txt = ''
            for blk in data.get('content', []):
                if blk.get('type') == 'text':
                    txt = blk.get('text', '').strip()
                    break
            if txt.startswith('```'):
                txt = re.sub(r'^```(?:json)?\s*', '', txt)
                txt = re.sub(r'\s*```\s*$', '', txt)
            if '{' in txt and '}' in txt:
                txt = txt[txt.index('{'):txt.rindex('}')+1]
            return bucket_ti, topic_idx, json.loads(txt), None
        except urllib.error.HTTPError as e:
            last_err = f"http_{e.code}"
            if e.code in (502, 503, 504, 429):
                time.sleep(2 ** attempt + (topic_idx % 3))  # 1+jitter, 2+jitter, 4+jitter ...
                continue
            return bucket_ti, topic_idx, None, last_err
        except json.JSONDecodeError as e:
            last_err = f"json_parse: {str(e)[:40]}"
            time.sleep(1.5)
            continue
        except Exception as e:
            last_err = str(e)[:60]
            time.sleep(2)
            continue
    return bucket_ti, topic_idx, None, f"retries_exhausted: {last_err}"


def heb_pct(s):
    if not s: return 0.0
    h = sum(1 for c in s if '\u0590' <= c <= '\u05FF')
    return h / len(s)


def validate(q):
    if q.get('skip'):
        return False, f"skip: {q.get('why', '')[:30]}"
    for k in ('q','o','c','e'):
        if k not in q: return False, f"missing_{k}"
    if not isinstance(q['o'], list) or len(q['o']) != 4:
        return False, f"opts_count_{len(q.get('o',[])) if isinstance(q.get('o'),list) else 'NA'}"
    if not isinstance(q['c'], int) or q['c'] not in (0,1,2,3):
        return False, f"bad_c_{q.get('c')}"
    if not 60 <= len(q['q']) <= 400: return False, f"q_len_{len(q['q'])}"
    if heb_pct(q['q']) < 0.40: return False, f"q_heb_{heb_pct(q['q']):.0%}"
    if not 200 <= len(q['e']) <= 700: return False, f"e_len_{len(q['e'])}"
    if heb_pct(q['e']) < 0.40: return False, f"e_heb_{heb_pct(q['e']):.0%}"
    for i, o in enumerate(q['o']):
        if not isinstance(o, str): return False, f"opt{i}_not_str"
        # FM-Core options are PLAIN strings — reject if accidentally prefixed with א./ב./ג./ד.
        if re.match(r'^[אבגד]\.\s*', o):
            return False, f"opt{i}_prefixed"
        if not 10 <= len(o) <= 220: return False, f"opt{i}_len_{len(o)}"
    blob = q['q'] + ' '.join(q['o']) + q['e']
    for bad in ['**','##','```','→','←','↑','↓']:
        if bad in blob: return False, f"contains_{bad}"
    # CJK / Cyrillic leak guard — Sonnet sometimes drops Chinese tokens
    # mid-Hebrew word (e.g. v1.6.0 Q[1060] had 悸 between ו and לב).
    if re.search(r'[\u4e00-\u9fff\u3040-\u30ff\u0400-\u04ff]', blob):
        return False, "non_target_script_leak"
    return True, "ok"


def dedup_check(new_q, existing_qs):
    fp = re.sub(r'\s+', ' ', new_q['q'][:60]).strip()
    for q in existing_qs:
        if re.sub(r'\s+', ' ', (q.get('q') or '')[:60]).strip() == fp:
            return False
    return True


def main():
    qs = json.load(open(QS_PATH, encoding='utf-8'))
    print(f"Loaded {len(qs)} existing Qs")
    jobs = []
    for ti, meta in BUCKETS.items():
        for idx, topic in enumerate(meta['topics'][:meta['n']]):
            jobs.append((ti, idx, topic, meta))
    print(f"Submitting {len(jobs)} jobs across {len(BUCKETS)} buckets")
    start = time.time()
    raw = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as ex:
        futs = {ex.submit(gen_one, ti, idx, topic, meta): (ti, idx)
                for ti, idx, topic, meta in jobs}
        done = 0
        for fut in concurrent.futures.as_completed(futs):
            ti, idx, q, err = fut.result()
            done += 1
            if err: print(f"  [{done:2d}/{len(jobs)}] ti={ti:2d} t{idx:02d}: ERR {err}")
            else: print(f"  [{done:2d}/{len(jobs)}] ti={ti:2d} t{idx:02d}: OK")
            if not err: raw.append((ti, idx, q))
    print(f"\nGen: {len(raw)}/{len(jobs)} got JSON in {time.time()-start:.0f}s")

    accepted = []
    rejected = []
    for ti, idx, q in raw:
        ok, why = validate(q)
        if not ok:
            rejected.append((ti, idx, why))
            continue
        if not dedup_check(q, qs + [a[2] for a in accepted]):
            rejected.append((ti, idx, "dup"))
            continue
        final = {
            "q": q['q'].strip(),
            "o": q['o'],
            "c": q['c'],
            "c_accept": [q['c']],
            "t": "FM-Core",
            "st": None,
            "ti": ti,
            "e": q['e'].strip(),
        }
        accepted.append((ti, idx, final))

    print(f"\nAccepted {len(accepted)}, rejected {len(rejected)}")
    for ti, idx, why in rejected[:15]:
        print(f"  ti={ti} t{idx:02d}: {why}")
    by_b = {ti:0 for ti in BUCKETS}
    for ti,_,_ in accepted: by_b[ti] += 1
    for ti,n in by_b.items():
        print(f"  ti={ti:2d}: +{n}")

    if not accepted:
        sys.exit(1)
    for _,_,q in accepted: qs.append(q)
    # Mishpacha canonical: indent=2, no trailing newline
    json.dump(qs, open(QS_PATH, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print(f"\nDone in {time.time()-start:.0f}s. Wrote {len(qs)} Qs to {QS_PATH}")


if __name__ == "__main__":
    main()
