#!/usr/bin/env node
// v1.4.3 — fill deep-link refs on existing AI-Hard Qs by matching actual `st` values.
import fs from 'node:fs';
const seedPath = 'data/ai_hard_seed.json';
const raw = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

// Goroll 8e chapter map — from actual `st` values observed in seed
const goroll = {
  'HTN — initiation threshold (Stage 1 + high-ASCVD)': 'Goroll 8e Ch 19 — Hypertension',
  'DM2 — SGLT2i in HF + CKD':                          'Goroll 8e Ch 102 — Diabetes Mellitus',
  'Lipids — statin intensity by ASCVD risk':           'Goroll 8e Ch 27 — Dyslipidemia',
  'AF — anticoagulation threshold by CHA2DS2-VASc':    'Goroll 8e Ch 28 — Atrial Fibrillation',
  'Asthma — GINA track-1 low-dose ICS-formoterol':     'Goroll 8e Ch 48 — Asthma',
  'COPD — GOLD 2023 ABE grouping':                     'Goroll 8e Ch 47 — COPD',
  'Subclinical hypothyroidism — treatment threshold':  'Goroll 8e Ch 104 — Thyroid Disorders',
  'Osteoporosis — FRAX threshold even at osteopenia':  'Goroll 8e Ch 164 — Osteoporosis',
  'Depression — PHQ-9 thresholds + first-line Rx':     'Goroll 8e Ch 227 — Depression',
  'Colonoscopy surveillance — low-risk adenoma':       'Goroll 8e Ch 56 — Colorectal Cancer Screening',
  'Adult vaccines — Shingrix after HZ':                'Goroll 8e Ch 7 — Adult Immunization',
  'CKD — SGLT2i for albuminuria':                      'Goroll 8e Ch 142 — CKD',
  'Dyspepsia — test-and-treat under age 60':           'Goroll 8e Ch 68 — Dyspepsia / H. pylori',
  'Chest pain — HEART score 0–3 management':           'Goroll 8e Ch 20 — Chest Pain Evaluation',
  'Strep pharyngitis — Centor 4 + RADT':               'Goroll 8e Ch 219 — Pharyngitis',
  'HFrEF — ARNI swap (quad pillars)':                  'Goroll 8e Ch 32 — Heart Failure',
  'EBM — NNT calculation from ARR':                    'Goroll 8e Ch 1 — Approach to the Patient',
};
// AFP/הר"י reference map — keyed by `st`, slugs for in-app deep-link
const afp = {
  'AOM — first-line amoxicillin high-dose':            { ref:'AFP — AOM Guidance 2019', slug:'aom-2019' },
  'Pediatric fever without source 3–36m, PCV13 era':   { ref:'AFP — Fever Without Source 2020', slug:'fws-2020' },
  'Recurrent UTI — nitrofurantoin prophylaxis':        { ref:'AFP — Recurrent UTI 2020', slug:'ruti-2020' },
  'Vertigo — HINTS (peripheral pattern)':              { ref:'AFP — Dizziness & Vertigo 2022', slug:'vertigo-2022' },
  'Contraception — migraine with aura = MEC 4':        { ref:'AFP — Contraception MEC 2020', slug:'contraception-mec-2020' },
  'PPD — EPDS threshold + Rx':                         { ref:'AFP — Postpartum Depression 2019', slug:'ppd-2019' },
  'ADHD — age-based first-line (behavior < 6)':        { ref:'AFP — ADHD 2020', slug:'adhd-2020' },
  'Lead — CDC 2021 BLRV 3.5 μg/dL':                    { ref:'AFP — Lead Poisoning 2022', slug:'lead-2022' },
  'Pediatric asthma exacerbation — first-line ED Rx':  { ref:'AFP — Pediatric Asthma 2020', slug:'peds-asthma-2020' },
  'DR — extended screening for well-controlled':       { ref:'AFP — Diabetic Retinopathy 2019', slug:'dr-2019' },
  'HRT — window of opportunity':                       { ref:'AFP — Menopause HRT 2021', slug:'hrt-2021' },
  'LBP — red flag for cauda equina':                   { ref:'AFP — Low Back Pain 2023', slug:'lbp-2023' },
  'Neonatal jaundice — AAP nomogram decision':         { ref:'AFP — Neonatal Jaundice 2021', slug:'neonatal-jaundice-2021' },
  'Macrocytic anemia — alcoholism + folate low':       { ref:'AFP — Macrocytic Anemia 2018', slug:'macrocytic-anemia-2018' },
  'Knee OA — non-pharm first-line':                    { ref:'AFP — Knee OA 2021', slug:'knee-oa-2021' },
  'Delirium — non-pharm first':                        { ref:'AFP — Delirium 2021', slug:'delirium-2021' },
  'Syncope — reflex (vasovagal) workup':               { ref:'AFP — Syncope 2019', slug:'syncope-2019' },
  'BCC — Mohs indication (H-zone)':                    { ref:'AFP — Skin Cancer 2020', slug:'skin-cancer-2020' },
  'Anaphylaxis — biphasic monitoring duration':        { ref:'AFP — Anaphylaxis 2020', slug:'anaphylaxis-2020' },
  'BPH — combo therapy by gland size':                 { ref:'AFP — BPH 2018', slug:'bph-2018' },
  'AUD — naltrexone first-line':                       { ref:'AFP — AUD Pharmacotherapy 2020', slug:'aud-2020' },
  'Opioid conversion — morphine PO → fentanyl patch':  { ref:'AFP — Opioid Conversion 2020', slug:'opioid-conversion-2020' },
};

let added = 0;
raw.forEach(q => {
  if (q.ref) return;
  if (q.t === 'AI-Hard-G' && goroll[q.st]) {
    q.ref = goroll[q.st]; added++;
  } else if (q.t === 'AI-Hard-AFP' && afp[q.st]) {
    q.ref = afp[q.st].ref; q.ref_slug = afp[q.st].slug; added++;
  }
});
fs.writeFileSync(seedPath, JSON.stringify(raw, null, 2) + '\n');

const noRef = raw.filter(q => !q.ref).length;
console.log('✓ Refs filled:', added);
console.log('  Total Qs:', raw.length);
console.log('  Qs without ref:', noRef);
if (noRef) {
  console.log('  Missing:');
  raw.forEach((q,i)=>{ if (!q.ref) console.log('    Q'+i+' ['+q.t+']: '+q.st); });
}
