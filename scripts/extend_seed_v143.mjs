#!/usr/bin/env node
// v1.4.3 seed extension — G (Nelson Peds), A (MSK/EBM/Cardio/Women's), C (deep-link refs)
// Distractors authored at parity-length to avoid correct_longest anti-pattern.
import fs from 'node:fs';

const seedPath = 'data/ai_hard_seed.json';
const raw = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

// --- C: deep-link refs on existing 39 Qs --------------------------------
const refMap = {
  'HTN — initiation threshold (Stage 1 + high-ASCVD)': 'Goroll 8e Ch 19',
  'DM — metformin + SGLT2 first-line':                 'Goroll 8e Ch 102',
  'Statin — secondary prevention LDL target':          'Goroll 8e Ch 27',
  'AF — stroke risk threshold (CHADS2-VASc)':          'Goroll 8e Ch 28',
  'COPD — ICS add-on trigger':                         'Goroll 8e Ch 47',
  'PE — D-dimer age-adjustment':                       'Goroll 8e Ch 51',
  'GERD — alarm-feature scope':                        'Goroll 8e Ch 61',
  'UTI — pregnancy asymptomatic bacteriuria':          'Goroll 8e Ch 136',
  'Hypothyroid — TSH target elderly':                  'Goroll 8e Ch 104',
  'Depression — SSRI first-line choice':               'Goroll 8e Ch 227',
  'Anaphylaxis — epinephrine IM timing':               'Goroll 8e Ch 226',
  'BPH — 5α-RI + α-blocker combination':               'Goroll 8e Ch 138',
  'AUD — naltrexone first-line':                       'Goroll 8e Ch 228',
  'Opioid — morphine PO → fentanyl patch conversion':  'Goroll 8e Ch 238',
  'NNT from ARR':                                      'Goroll 8e Ch 1',
  'HF — quad-pillar ARNI swap':                        'Goroll 8e Ch 32',
  'BCC — Mohs for H-zone':                             'Goroll 8e Ch 177',
};
const afpRefMap = {
  'Prostate cancer screening — shared decision':       { ref:'AFP — Prostate Cancer Screening 2019', slug:'prostate-cancer-screening-2019' },
  'Lower back pain — red flags':                        { ref:'AFP — Acute Low Back Pain RER 2023', slug:'acute-low-back-pain-rer-2023' },
  'Rotator cuff tear — imaging':                        { ref:'AFP — Shoulder Pain 2020', slug:'shoulder-pain-2020' },
  'Migraine — acute triptan choice':                    { ref:'AFP — Migraine 2018', slug:'migraine-2018' },
  'Statin myopathy — CK threshold':                     { ref:'AFP — Statin Adverse Effects 2019', slug:'statin-adverse-effects-2019' },
  'OSA — STOP-BANG threshold':                          { ref:'AFP — OSA RER 2021', slug:'osa-rer-2021' },
  'Otitis media — watchful waiting':                    { ref:'AFP — AOM 2019', slug:'aom-2019' },
  'Chronic kidney disease — ACR threshold':             { ref:'AFP — CKD 2020', slug:'ckd-2020' },
  'Osteoporosis — DEXA screening age':                  { ref:'AFP — Osteoporosis Screening 2021', slug:'osteoporosis-screening-2021' },
  'Abdominal aortic aneurysm — USPSTF':                 { ref:'AFP — AAA Screening 2019', slug:'aaa-screening-2019' },
  'Otitis externa — topical vs oral':                   { ref:'AFP — Acute Otitis Externa RER 2023', slug:'aoe-rer-2023' },
  'Contraception — LARC first-line':                    { ref:'AFP — Contraception 2019', slug:'contraception-2019' },
  'Vaginitis — BV vs candida workup':                   { ref:'AFP — Vaginitis 2018', slug:'vaginitis-2018' },
  'Hematuria — microscopic workup':                     { ref:'AFP — Microscopic Hematuria 2020', slug:'microscopic-hematuria-2020' },
  'Gout — urate target':                                { ref:'AFP — Gout 2019', slug:'gout-2019' },
  'GDM — screening approach':                           { ref:'AFP — GDM 2020', slug:'gdm-2020' },
  'Hyperbilirubinemia in newborn — phototherapy':       { ref:'AFP — Neonatal Jaundice 2021', slug:'neonatal-jaundice-2021' },
  'Acne — moderate severity treatment':                 { ref:'AFP — Acne 2019', slug:'acne-2019' },
  'Iron deficiency anemia — ferritin cut-off':          { ref:'AFP — IDA 2018', slug:'ida-2018' },
};

let refsAdded = 0;
raw.forEach(q => {
  if (q.ref) return;
  if (q.t === 'AI-Hard-G') {
    const m = refMap[q.st];
    if (m) { q.ref = m; refsAdded++; }
  } else if (q.t === 'AI-Hard-AFP') {
    const m = afpRefMap[q.st];
    if (m) { q.ref = m.ref; q.ref_slug = m.slug; refsAdded++; }
  }
});

// --- D: repair distractor anti-patterns in existing seed (v1.4.3) --------
// 9 Qs where correct answer is 1.8× longer than longest distractor.
// Strategy: pad distractors to parity length with plausible clinical detail.
const distractorFixes = {
  23: [ // Pediatric asthma exacerbation
    'אויר סביבתי + observation של שעה לפני החלטה',
    null, // keep correct
    'Epinephrine IM 0.01 mg/kg מיידי + שחרור לבית',
    'Magnesium sulfate IV 40 mg/kg כקו ראשון יחיד'
  ],
  25: [ // HRT window of opportunity
    null,
    'HRT contraindicated לאחר מנופוזה בכל גיל',
    'SSRI / SNRI (paroxetine / venlafaxine) = קו ראשון יחיד',
    'Lifestyle וטיפול לא-תרופתי בלבד — HRT רק במקרה קיצון'
  ],
  26: [ // LBP red flag cauda equina
    '"האם הכאב מחמיר בישיבה ממושכת?" — חשש discitis',
    null,
    '"האם הכאב מקרין לירך הקדמית?" — חשש meralgia paresthetica',
    '"האם יש עייפות כללית ונפילות תכופות?" — חשש anemia'
  ],
  27: [ // Neonatal jaundice nomogram
    'לעקוב 24 שעות וחזור למדידה לפני החלטה טיפולית',
    null,
    'Exchange transfusion מיידית ללא התחשבות בערך נומוגרמה',
    'UGT1A1 sequencing טרם החלטה על phototherapy'
  ],
  28: [ // Macrocytic anemia alcoholism
    'Pernicious anemia — חסר intrinsic factor + anti-IF antibodies',
    null,
    'Myelodysplastic syndrome — צורך biopsy מח עצם לאימות',
    'Hypothyroidism — בדיקת TSH לפני כל החלטה טיפולית'
  ],
  30: [ // Delirium non-pharm
    'Haloperidol 0.5 mg BID קבוע לכל חולה עם delirium בגיל מבוגר',
    null,
    'Lorazepam 0.5 mg q4h IV למניעת agitation סיסטמית',
    'Physical restraints רוטיניים עד ההתייצבות הקוגניטיבית'
  ],
  31: [ // Syncope vasovagal workup
    'Cardiac monitor 48 שעות לכל חולה עם סינקופה ראשונה',
    null,
    'MRI מוח מיידי לשלול stroke או TIA אחורי',
    'Echocardiogram + stress test routine לכל חולה מעל 40'
  ],
  32: [ // HFrEF ARNI swap
    'הוספת digoxin לשליטה ב-HR וחיזוק התכווצות',
    null,
    'הוספת CCB (amlodipine) לוויסות לחץ דם והיקף',
    'הוספת loop diuretic קבוע ללא מדידת חסר/עודף'
  ],
  34: [ // Anaphylaxis biphasic monitoring — pad all distractors + shorten correct via ref
    'עד שהתסמינים נפתרו לחלוטין — סביב 30-60 דקות לרוב החולים',
    'כשעה לאחר פתרון התסמינים — זמן ממוצע מחקרי של תגובת rebound',
    'לפחות 4 שעות לאחר פתרון (6–8 שעות אם חמור / אסתמה / biphasic בעבר)',
    '24 שעות בכל חולה — אשפוז חובה לאחר כל anaphylaxis בכל דרגה'
  ],
};
Object.entries(distractorFixes).forEach(([i, newOpts]) => {
  const idx = +i;
  const q = raw[idx];
  if (!q) return;
  const opts = q.o || q.options;
  newOpts.forEach((newOpt, j) => {
    if (newOpt !== null) opts[j] = newOpt;
  });
});
console.log('✓ Repaired', Object.keys(distractorFixes).length, 'distractor anti-patterns');

// --- G: Nelson Peds Qs, parity-length distractors -----------------------
const nelsonQs = [
  {
    q: 'תינוקת בת 48 שעות, הנקה בלעדית, TSB כולל = 16 mg/dL. לפי נומוגרמת Bhutani שעתית + AAP 2022:',
    o: [
      'Phototherapy אם חצה סף שעתי-ספציפי לגיל + גורמי סיכון',
      'המתנה 24h ובדיקה חוזרת עם אור יום',
      'Exchange transfusion מיד לכל תינוק ≥15 mg/dL',
      'הפסקת הנקה ומעבר לפורמולה ל-72 שעות'
    ],
    c: 0, c_accept:[0], t:'AI-Hard-N',
    st:'Neonatal jaundice — phototherapy threshold',
    ti: 23,
    e:'AAP 2022 עדכנה את נומוגרמת Bhutani עם ספי phototherapy גבוהים ב-2–3 mg/dL מהמסמך 2004. Phototherapy מתחילה כשהערך חוצה סף שעתי-ספציפי (≈15–17 ב-48h ללא גורמי סיכון). המתנה שגויה אחרי סף. Exchange transfusion שמור ל-≥25 mg/dL או אנצפלופתיה. הפסקת הנקה מחריפה dehydration ומעלה את הבילירובין.',
    src:'Nelson 22e Ch 137',
    ref:'Nelson 22e Ch 137 — Jaundice in Newborn'
  },
  {
    q: 'תינוק בן 3 חודשים, ברונכיוליט (RSV+), sat 94% RA, RR 52, מזין. לפי AAP 2014 + Nelson Ch 114:',
    o: [
      'תמיכה (hydration + O2 PRN) בלבד; ללא ברונכודילטטור, steroids או abx שגרתיים',
      'Salbutamol ניסיוני; המשך אם תגובה קלינית נצפית',
      'Prednisolone 2 mg/kg PO ×5 ימים למניעת החמרה',
      'Racemic epinephrine נבולייזר כל 4 שעות שגרתי'
    ],
    c: 0, c_accept:[0], t:'AI-Hard-N',
    st:'Bronchiolitis — supportive care only',
    ti: 24,
    e:'AAP 2014 (Ralston) הסירה ברונכודילטטורים וסטרואידים שגרתיים — מטא-אנליזות לא הראו תועלת על LOS או SaO₂. Racemic epi שמור להתדרדרות. טריאל היה בעבר אך גם הוסר. Cornerstone = O2 מעל 90-92%, הידרציה, ניטור. Nelson 22e משקף הנחייה זהה.',
    src:'Nelson 22e Ch 114',
    ref:'Nelson 22e Ch 114 — Bronchiolitis'
  },
  {
    q: 'בן 5 עם fever 39.5 + meningeal signs. LP: WBC 2,000 PMN, glucose 25, protein 180. טיפול אמפירי ראשון לפי Nelson + IDSA:',
    o: [
      'Ceftriaxone + vancomycin + dexamethasone טרם/עם AB ראשון',
      'Ampicillin + gentamicin (כיסוי Listeria + GBS)',
      'Ceftriaxone מונותרפי ללא vanc בפרה-אסכולי',
      'Meropenem + linezolid כקו ראשון אמפירי'
    ],
    c: 0, c_accept:[0], t:'AI-Hard-N',
    st:'Bacterial meningitis beyond neonatal — empirical',
    ti: 24,
    e:'מעל גיל 1 חודש: Strep pneumo + N. meningitidis. Ceftriaxone מכסה, vanc נדרש ל-PRSP. Dexamethasone 0.15 mg/kg q6h ×4d לפני/עם מנת AB ראשונה. Ampi+gent = נאונטלי (GBS/Listeria). Ceftriaxone לבד חסר vanc. Meropenem שמור לרזרבה.',
    src:'Nelson 22e Ch 167',
    ref:'Nelson 22e Ch 167 — Bacterial Meningitis'
  },
  {
    q: 'ילד בן 7, אסתמה step 2 (ICS נמוך + SABA PRN). בחודש: 3 התקפים, SABA יומי, שינה מופרעת 2×/שבוע. GINA 2024:',
    o: [
      'החלפת ICS נמוך ב-ICS-formoterol כ-MART (maintenance + reliever)',
      'הכפלת מינון ICS קבוע בלי שינוי reliever',
      'הוספת montelukast יומי ל-ICS קיים',
      'Prednisolone PO 5 mg יומי קבוע למניעת exacerbation'
    ],
    c: 0, c_accept:[0], t:'AI-Hard-N',
    st:'Pediatric asthma — step-up to SMART/MART',
    ti: 3,
    e:'GINA 2024 (track 1) ממליצה על SMART/MART ב-step 3 מעל גיל 6 — מפחית exacerbations מעל ICS קבוע + SABA. הכפלת ICS פחות יעיל. Montelukast add-on עם black-box נוירופסיכיאטרי. Prednisolone כרוני = step 5 fallback בלבד.',
    src:'Nelson 22e Ch 185',
    ref:'Nelson 22e Ch 185 — Childhood Asthma'
  },
  {
    q: 'בן 4, בליעת paracetamol כ-4h לפני, אסימפטומטי. רמה ב-4h = 160 μg/mL. Rumack-Matthew + AAP toxicology:',
    o: [
      'NAC מיידי — מעל קו treatment (150 μg/mL ב-4h)',
      'פחם פעיל 1 g/kg כעת — מקסם ספיגה',
      'שחרור הביתה עם מעקב טלפוני ב-24h',
      'המתנה לרמה בשעה 8 לפני החלטה טיפולית'
    ],
    c: 0, c_accept:[0], t:'AI-Hard-N',
    st:'Acetaminophen poisoning — NAC threshold',
    ti: 24,
    e:'Rumack-Matthew treatment line = 150 μg/mL ב-4h (לוגריתמית). 160 > קו → NAC (PO 140→70×17 או IV 150→50→100). פחם פעיל יעיל רק בשעה הראשונה. המתנה ל-8h מטעה — הפגיעה מצטברת; NAC עד 8-10h = יעיל מלא.',
    src:'Nelson 22e Ch 94',
    ref:'Nelson 22e Ch 94 — Poisoning'
  },
  {
    q: 'ילד בן 3 עם DKA (pH 7.18, HCO3 12, glu 580). עקרון החייאת נוזלים לפי PECARN FLUID + ISPAD:',
    o: [
      'Isotonic 10 mL/kg על שעה, ואז החלפת חסר על 24–48h; הימנע מירידה מהירה באוסמולריות',
      'Bolus 40 mL/kg על 30 דקות כדי להתחיל אינסולין מוקדם',
      'D5W IV מיידי כי הגלוקוז צפוי ליפול מהר',
      'Sodium bicarbonate 1 mEq/kg להחזרת pH לקרוב ל-7.3'
    ],
    c: 0, c_accept:[0], t:'AI-Hard-N',
    st:'Pediatric DKA — fluid resuscitation',
    ti: 24,
    e:'PECARN FLUID 2018 + ISPAD 2022: החייאה איטית (10 mL/kg/h) ואז 24–48h החלפה. Bolus אגרסיבי מעלה סיכון cerebral edema (הסיבוך הפטאלי של peds DKA). Bicarbonate — רק pH<6.9 עם פגיעה המודינמית. אינסולין 0.05–0.1 u/kg/h אחרי שעה-שעתיים נוזלים. D5W מתווסף כשגלוקוז <250-300.',
    src:'Nelson 22e Ch 546',
    ref:'Nelson 22e Ch 546 — Pediatric Diabetes'
  },
  {
    q: 'בן 8, ADHD משולב, מזיק ללימודים. גיל בית ספר יסודי (6-12). AAP 2019 + NICE 2018 — first-line:',
    o: [
      'Stimulant (methylphenidate/amphetamine) בשילוב behavior therapy הורים+מורים',
      'Behavior therapy לבד לפחות 6 חודשים לפני ניסיון תרופתי',
      'Atomoxetine monotherapy — לא-ממריץ, בטוח יותר ללב',
      'Clonidine XR first-line — מועדף לילדים רגישים'
    ],
    c: 0, c_accept:[0], t:'AI-Hard-N',
    st:'Peds ADHD — first-line pharmacotherapy ≥6 yo',
    ti: 25,
    e:'AAP 2019: גיל 6–12 = stimulant + behavior בשילוב. גיל 4–5 = behavior בלבד קודם. Atomoxetine + guanfacine/clonidine XR = קו שני (אי-תגובה או effect-side). Behavior בלבד לא יעיל ב-ADHD בינוני-חמור בגיל בית-ספר.',
    src:'Nelson 22e Ch 50',
    ref:'Nelson 22e Ch 50 — ADHD'
  },
  {
    q: 'נערה בת 15, דיכאון + passive suicidal ideation, על sertraline, ניסיון paracetamol לפני שנה. איזה מצב דורש התערבות בהולה מכולם?',
    o: [
      'תוכנית ספציפית + גישה לנשק בבית (רובה לא נעול של האב)',
      'Passive ideation בלבד ללא תוכנית או כוונה',
      'היסטוריית דיכאון משפחתית משמעותית בדרגה ראשונה',
      'Substance use חברתי בסוף-שבוע (alcohol, ללא עצמית)'
    ],
    c: 0, c_accept:[0], t:'AI-Hard-N',
    st:'Adolescent suicide — risk stratification red flags',
    ti: 25,
    e:'Columbia SSRS + Nelson: תוכנית + means-access (במיוחד נשק) = HIGH imminent risk → השמה + הרחקת נשק. Passive ideation = low-moderate, דורש מעקב. Substance use ודיכאון = גורמי סיכון אך לא חירום כשלעצמם. יש לשאול במפורש על plan/means/intent/timing.',
    src:'Nelson 22e Ch 40',
    ref:'Nelson 22e Ch 40 — Suicide'
  },
  {
    q: 'תינוק בן 8 שבועות, הנקה בלעדית. וויטמין D — המלצה AAP 2022 + Nelson Ch 61:',
    o: [
      '400 IU/day מהלידה עד גמילה ל-≥1L פורמולה מועשרת ליום',
      '1000 IU/day רק אם הנקה בלעדית מוחלטת ללא פורמולה',
      'לא נדרש — חלב-אם מספק ויטמין D בכמות מספקת',
      'רק אם כהה-עור או פג מתחת 34 שבועות'
    ],
    c: 0, c_accept:[0], t:'AI-Hard-N',
    st:'Infant feeding — vitamin D supplementation',
    ti: 23,
    e:'AAP/IOM: 400 IU/day מיום הלידה לכל תינוק יונק בלעדית או בעיקר, עד גמילה ל-≥1L פורמולה מועשרת. חלב-אם <25 IU/L. 1000 IU = טיפול בחסר, לא מניעה. חשיפה לשמש <6חו לא מומלצת — המלצה זהה לכל עור.',
    src:'Nelson 22e Ch 61',
    ref:'Nelson 22e Ch 61 — Feeding Healthy Infants'
  },
  {
    q: 'ילד 14 חודשים: Hgb 9.2, MCV 68, ferritin 8, CRP תקין. שותה >30 oz חלב-פרה/יום. טיפול לפי AAP + Nelson Ch 400:',
    o: [
      'Iron elemental 3–6 mg/kg/day PO + הגבלת חלב פרה ל-16–24 oz/day',
      'Iron 1 mg/kg/day PO בלבד, ללא שינוי תזונתי כרגע',
      'עירוי דם כיוון שההמוגלובין מתחת לסף הסימפטומטי',
      'IV iron מיידי, כי PO לא סובל בילד קטן בגיל הזה'
    ],
    c: 0, c_accept:[0], t:'AI-Hard-N',
    st:'Iron deficiency anemia — treatment dose',
    ti: 23,
    e:'AAP: IDA ילד קטן → 3–6 mg/kg/day ×3 חודשים (נורמליזציה + 2-3 חו מילוי מאגרים). חלב-פרה מוגבל ל-16–24 oz — הגורם הראשי (מעכב ספיגה + דל Fe + דם microGI). עירוי רק Hgb<5-6 סימפטומטי. IV iron רק כישלון PO או malabsorption.',
    src:'Nelson 22e Ch 400',
    ref:'Nelson 22e Ch 400 — Iron Deficiency Anemia'
  },
  {
    q: 'תינוק בן 24 שעות, משקל לידה 3.5 ק"ג, מזין טוב. POC glucose = 38 mg/dL, אסימפטומטי. לפי AAP 2011 (Adamkin):',
    o: [
      'הזנה מיידית (breast / 10 mL formula) ובדיקה חוזרת תוך 30 דקות',
      'Glucagon 1 mg IM מיידי לכל תינוק מתחת 45 mg/dL',
      'המתנה עד 12 שעות חיים ואז בדיקה שנייה סטנדרטית',
      'D50% bolus 2 mL/kg IV מיד דרך קו-היקפי גדול'
    ],
    c: 0, c_accept:[0], t:'AI-Hard-N',
    st:'Neonatal hypoglycemia — AAP threshold-based approach',
    ti: 23,
    e:'AAP 2011: תינוק בסיכון (LGA/SGA/LPT/IDM) + אסימפטומטי → הזנה קודם, ואז בדיקה חוזרת. D10W IV (לא D50 — heme sclerosis) אם <25 בשעה הראשונה או <35 אחרי הזנה, או סימפטומטי. גלוקגון רק בחסר עמיד עם מאגרי גליקוגן. המתנה 12h מסוכנת.',
    src:'Nelson 22e Ch 22',
    ref:'Nelson 22e Ch 22 — The Newborn'
  },
  {
    q: 'בת 8 עם egg allergy חמורה (אנפילקסיס בעבר). ACIP 2024 — איזה חיסון מחייב זהירות מיוחדת?',
    o: [
      'Yellow fever — עתיר egg protein, דורש הערכת אלרגולוג לפני מתן',
      'MMR — אסור מתחת גיל 9 בכל egg-allergic בגלל סיכון',
      'Inactivated influenza — אסור בכל אלרגיה לביצה',
      'DTaP — זהירות במתן, לרוב נמנע בילדים רגישים'
    ],
    c: 0, c_accept:[0], t:'AI-Hard-N',
    st:'Vaccines — egg allergy and vaccine safety',
    ti: 24,
    e:'ACIP 2024: MMR + flu (IIV/LAIV) — ללא מגבלה עם egg allergy חמורה (הדרישה לצפייה מיוחדת הוסרה). Yellow fever = egg protein גבוה → desensitization / אלרגולוג. DTaP לא קשור לביצה. חשוב לפני נסיעות לאזורים אנדמיים.',
    src:'Nelson 22e Ch 225',
    ref:'Nelson 22e Ch 225 — Vaccines'
  },
  {
    q: 'אם בשבוע 28 להריון, מבקשת Tdap. ACIP/ACOG — זמן אידיאלי:',
    o: [
      'שבועות 27–36 בכל הריון, גם אם חוסנה בהריון קודם',
      'רק אם חלפו מעל 10 שנים מ-Tdap האחרון שלה',
      'לאחר לידה בלבד ("cocooning") + חיסון בני משפחה קרובים',
      'אסור בהריון — הורמונים משנים את התגובה החיסונית'
    ],
    c: 0, c_accept:[0], t:'AI-Hard-N',
    st:'Vaccines — Tdap in pregnancy',
    ti: 24,
    e:'ACIP: Tdap בכל הריון 27-36 שבועות (אידיאלי סוף T2 / תחילת T3) למעבר נוגדנים מקסימלי לעובר למניעת pertussis בינקות. Cocooning משלים אך לא מחליף. מגבלת 10 שנים לא רלוונטית בהריון.',
    src:'Nelson 22e Ch 225',
    ref:'Nelson 22e Ch 225 — Vaccines'
  },
  {
    q: 'בן 7 ב-triage: fever 40, HR 155, BP 78/45, lethargic. PAT + Pediatric Sepsis 1-hour bundle:',
    o: [
      'Isotonic saline 20 mL/kg + AB רחב-טווח (ceftriaxone) תוך שעה מהזיהוי',
      'CT-מוח לפני כל צעד לשלול סיבה נוירולוגית להלם',
      'LP מיידי לפני AB כדי לקבל תרבית CSF נקייה',
      'המתנה לתוצאות מעבדה בטרם החלטה על נוזלים ו-AB'
    ],
    c: 0, c_accept:[0], t:'AI-Hard-N',
    st:'Triage acutely ill child — sepsis',
    ti: 24,
    e:'Septic shock peds 1-hour bundle: 20 mL/kg NS חוזר עד 60 mL/kg, AB רחב (ceftriaxone) תוך שעה, O2. LP/CT נדחים אם לא יציב. עיכוב AB = +7% תמותה/שעה. Nelson Ch 78 מדגיש PAT (appearance, work of breathing, circulation) כ-triage.',
    src:'Nelson 22e Ch 78',
    ref:'Nelson 22e Ch 78 — Triage of Acutely Ill Child'
  },
  {
    q: 'ילדה בת 10, סינקופה תוך ריצה, ללא prodrome, אין היסטוריה משפחתית ידועה. ECG: QTc 480ms. Nelson Ch 84 + AHA 2018:',
    o: [
      'הפניה לקרדיולוג ילדים מיידית — חשד ל-LQTS / סיבה קרדיאלית',
      'Tilt-table test באמבולטורי — vasovagal הוא המסתבר ביותר',
      'Reassurance ושחרור עם המלצה על שתייה וזהירות',
      'MRI מוח לשלול דימום תוך-מוחי או גידול אחורי'
    ],
    c: 0, c_accept:[0], t:'AI-Hard-N',
    st:'Peds syncope — exertional red flag',
    ti: 24,
    e:'דגלי אדום בסינקופה peds: מאמץ, ללא prodrome, hx משפחתית של מוות פתאומי, QTc>460-470(♀)/>450(♂). זה LQTS קלאסי. Tilt-table low-yield בילדים. סינקופה אקסרציונלית = cardiac עד הוכחה.',
    src:'Nelson 22e Ch 84',
    ref:'Nelson 22e Ch 84 — Syncope'
  },
  {
    q: 'ביקור 12 חודשים Well-child במרפאה. AAP Bright Futures + Nelson Ch 13 — סקר חובה:',
    o: [
      'Hgb + סקר עופרת לפי גורמי סיכון (Medicaid, דיור ישן, תעשייה)',
      'TSH שגרתי חוזר כחלק ממעקב מתמיד אחרי newborn screen',
      'Urinalysis שגרתי לגילוי pyuria אסימפטומטית מוקדמת',
      'Lipid panel שגרתי למדידת כולסטרול עם אבחון מוקדם'
    ],
    c: 0, c_accept:[0], t:'AI-Hard-N',
    st:'Well-child screening — 12-month visit',
    ti: 23,
    e:'Bright Futures 12m: Hgb (IDA) + Lead (סיכון גבוה — Medicaid, בית <1978, אזור תעשייה). TSH = רק newborn screen. Urinalysis שגרתי — לא (pyuria א-סימפטומטית חסר משמעות). Lipid — 9-11 שנים (אוניברסלי) או 2-8 אם risk factors.',
    src:'Nelson 22e Ch 13',
    ref:'Nelson 22e Ch 13 — Screening'
  },
];

// --- A: 8 IMA-weighted Qs for Cardio/MSK/EBM/Women's/Pain --------------
const aQs = [
  {
    q: 'בת 66, AF חדשה + HTN + DM + CHF. CHA₂DS₂-VASc = 4. ESC 2024 + AHA 2023 — טיפול מונע שבץ:',
    o: [
      'DOAC (apixaban/rivaroxaban/edoxaban) — מועדף על warfarin',
      'Warfarin עם INR יעד 2-3 בהתאמה פרטנית',
      'Aspirin 81 mg יומי — הוכח יעיל בסיכון בינוני',
      'Clopidogrel 75 mg monotherapy ב-AF לא-ואלוולארי'
    ],
    c: 0, c_accept:[0], t:'AI-Hard-G',
    st:'AF — DOAC over warfarin non-valvular',
    ti: 0,
    e:'ESC 2024 + AHA 2023: DOAC קו ראשון ב-nvAF עם CHA₂DS₂-VASc ≥2(♂)/≥3(♀). Warfarin = קו שני / valvular/mechanical. Aspirin ו-clopidogrel לא יעילים ב-AF והוסרו. 4 נקודות ← DOAC חובה.',
    src:'Goroll 8e Ch 28',
    ref:'Goroll 8e Ch 28'
  },
  {
    q: 'בן 35, כאב כתף שמאל לאחר עבודה פיזית. Apley + empty can חיוביים, טווח תנועה מופחת מעל 90°. AFP 2020 Shoulder Pain:',
    o: [
      'PT 6–12 שבועות + NSAID; US/MRI רק אם אין שיפור או full-thickness חשוד',
      'MRI מיידי — חובה לכל חשד rotator cuff לאימות האבחנה',
      'Arthroscopic repair דחוף — acute tears מגיבים הכי טוב כשמתקנים מיד',
      'Steroid subacromial injection כקו ראשון בודד, חוזר 3 שבועות'
    ],
    c: 0, c_accept:[0], t:'AI-Hard-AFP',
    st:'Rotator cuff tear — imaging',
    ti: 9,
    e:'AFP 2020: ללא חולשה חמורה / full-thickness → conservative 6-12 שבועות (PT + NSAID ± injection). כישלון או full-thickness בצעיר עם דרישה פונקציונלית גבוהה → imaging ואז repair. MRI מיידי לא cost-effective. Injection כ-monotherapy לא עדיף על PT.',
    src:'AFP — Shoulder Pain 2020',
    ref:'AFP — Shoulder Pain 2020',
    ref_slug:'shoulder-pain-2020'
  },
  {
    q: 'חולה על statin למניעה משנית, כאבי שרירים, CK 350 (<5× ULN), ללא חולשה, eGFR תקין. AFP 2019 + ACC 2022:',
    o: [
      'המשך ה-statin, reassurance; שקול dose-reduction או switch אם מפריע',
      'הפסק מיידית — כל CK מעל הנורמה מצביע על סיכון rhabdomyolysis',
      'החלף ל-ezetimibe monotherapy — שקול סטטין שוב בעוד שנה',
      'הוסף hydroxychloroquine להקלה על דלקת השרירים הסמויה'
    ],
    c: 0, c_accept:[0], t:'AI-Hard-AFP',
    st:'Statin myopathy — CK threshold',
    ti: 2,
    e:'AFP 2019: SAMS — רוב CK תקין/<5× ULN. המשך statin אם CK<5× ULN ללא חולשה; שקול dose-reduction/alternate-day/switch rosuvastatin/pravastatin. הפסקה אם CK>10× ULN / rhabdo / אי-סבילות. Ezetimibe = add-on, לא תחליף ב-2° prevention.',
    src:'AFP — Statin Adverse Effects 2019',
    ref:'AFP — Statin Adverse Effects 2019',
    ref_slug:'statin-adverse-effects-2019'
  },
  {
    q: 'בת 55 בגיל הבלות, hot flashes + אי-שינה, ללא VTE/CAD/שד. NAMS 2022 — טיפול אופטימלי:',
    o: [
      'HRT (estradiol + progestin עם רחם) — בטוח ב-≤59 או ≤10 שנים מהבלות',
      'Estrogen monotherapy — גם עם רחם אם המינון נמוך מספיק',
      'SSRI/SNRI כקו ראשון קודם לניסיון HRT בכל אישה מעל 50',
      'HRT אסור מעל גיל 50 — סיכון CV עולה בכל אישה לאחר הבלות'
    ],
    c: 0, c_accept:[0], t:'AI-Hard-G',
    st:"Menopause HRT — decision framework",
    ti: 14,
    e:'NAMS 2022: HRT הטיפול היעיל ביותר ל-VMS. בטוח ב-healthy ≤59 או ≤10 שנים מבלות, ללא VTE/CAD/שד. רחם = progestin חובה להגן אנדומטריון. SSRI/SNRI (paroxetine/venlafaxine) = קו שני אם לא יכול HRT. >60 או >10 שנים = שיקול, לא איסור.',
    src:'Goroll 8e Ch 119',
    ref:'Goroll 8e Ch 119'
  },
  {
    q: 'מחקר RCT: ARR = 2.5%. חשב NNT:',
    o: [
      'NNT = 40 — צריך לטפל ב-40 למנוע אירוע אחד',
      'NNT = 25 — חישוב על 100 חולים ב-2.5 נפילות',
      'NNT = 2.5 — אפקט חזק, טיפול קליני מיידי נדרש',
      'NNT = 250 — תוצאה זניחה של יעילות חלשה במחקר'
    ],
    c: 0, c_accept:[0], t:'AI-Hard-AFP',
    st:'NNT from ARR — mental-math',
    ti: 26,
    e:'NNT = 1/ARR (עשרוני): 1/0.025 = 40. משמעות: טיפול ב-40 חולים → מניעת אירוע אחד בתקופת המחקר. במניעה משנית CV זה משמעותי; במניעה ראשונית סיכון נמוך NNT 100-200 עדיין יכול להיות cost-effective.',
    src:'Goroll 8e Ch 1',
    ref:'Goroll 8e Ch 1'
  },
  {
    q: 'בדיקה: sensitivity 95%, specificity 80%. שכיחות 1%. PPV:',
    o: [
      '≈4.6% — ב-low prevalence, FP מציף את ה-TP',
      '≈95% — PPV קרוב ל-sensitivity כשהסף גבוה',
      '≈80% — PPV משקף specificity ישירות',
      '≈50% — הממוצע בין sens ל-spec הוא הכלל'
    ],
    c: 0, c_accept:[0], t:'AI-Hard-AFP',
    st:'PPV at low prevalence',
    ti: 26,
    e:'2×2 על 10,000: מחלה=100 (TP=95, FN=5), בריא=9,900 (TN=7920, FP=1980). PPV = 95/(95+1980) = 4.58%. לקח: בשכיחות 1% גם בדיקה טובה נותנת רוב FP — USPSTF דורש harm-benefit לפני סקירה המונית.',
    src:'AFP — Evidence-Based Medicine Primer',
    ref:'AFP — EBM Basics',
    ref_slug:'ebm-basics'
  },
  {
    q: 'בן 70, hip fracture + קוגניציה ירודה, DNR. AGS Beers + ACP 2023 — ניהול כאב:',
    o: [
      'Paracetamol 3–4 g/day קבוע + opioid PRN; הימנע NSAID מעל 65 ב-CKD/HF',
      'Morphine PO קבוע מהיום הראשון למניעת כאב פורץ מתמיד',
      'NSAID קבוע בשילוב PPI — מגן קיבה גם בגיל מבוגר',
      'Tramadol 50 mg q6h קבוע — חלופה בטוחה יותר מ-opioid חזק'
    ],
    c: 0, c_accept:[0], t:'AI-Hard-G',
    st:'Geriatric pain — acetaminophen first',
    ti: 21,
    e:'AGS Beers + ACP 2023: paracetamol 3–4 g/day = כסולד ראשון לקשיש עם פרקטורה/OA. NSAID נמנע >65 עם CKD/HF/anticoag/PUD. Tramadol ברשימה (seizure, סרוטונרגי, delirium). Morphine קבוע מהיום הראשון ללא escalation לא מומלץ.',
    src:'Goroll 8e Ch 238',
    ref:'Goroll 8e Ch 238'
  },
  {
    q: 'בן 62, GERD >2 שנים, לא מגיב ל-PPI סטנדרטי, ללא alarm. ACG 2022:',
    o: [
      'EGD — refractory PPI = אינדיקציה לשלול Barrett / EoE / esophagitis',
      'הכפלת PPI ל-6 חודשים נוספים לפני כל בירור אנדוסקופי',
      'H2-blocker הוספה בלבד — זול ויעיל כמו EGD בשלב הזה',
      'Nissen fundoplication מיידי — refractory מחייב פתרון סופי'
    ],
    c: 0, c_accept:[0], t:'AI-Hard-G',
    st:'GERD — EGD indication (refractory)',
    ti: 4,
    e:'ACG 2022: refractory GERD (failed 8 שבועות PPI מלא) → EGD לשלול Barrett, EoE, esophagitis, לאמת אבחנה. הכפלת מינון אופציונלית אך לא מחליפה EGD. H2 add-on פחות יעיל. Fundoplication = אופציה אחרי אבחון + pH-impedance, לא ראשון.',
    src:'Goroll 8e Ch 61',
    ref:'Goroll 8e Ch 61'
  },
];

const newQs = [...nelsonQs, ...aQs];
const combined = [...raw, ...newQs];

fs.writeFileSync(seedPath, JSON.stringify(combined, null, 2) + '\n');

console.log('✓ Extended ai_hard_seed.json');
console.log('  Existing:', raw.length);
console.log('  New Nelson (AI-Hard-N):', nelsonQs.length);
console.log('  New IMA-weighted (A):', aQs.length);
console.log('  Refs added to existing:', refsAdded);
console.log('  Total Qs:', combined.length);

// Quality check
let findings = {correct_longest:[], option_too_short:[], duplicates:0};
const stems = new Set();
combined.forEach((q,i) => {
  const opts = q.o || q.options || [];
  if (!opts.length) return;
  const correct = opts[q.c ?? 0];
  const others = opts.filter((_,j)=>j!==(q.c ?? 0));
  if (correct && others.length) {
    const corLen = correct.length;
    const maxOther = Math.max(...others.map(x=>x.length));
    if (corLen >= maxOther * 1.8 && corLen - maxOther > 20) findings.correct_longest.push({i, corLen, maxOther, st: q.st});
  }
  // Single-char options valid for IMA A/B/C/E multi-accept format + numeric NNT; skip.
  const minLen = Math.min(...opts.map(o=>o.length));
  const maxLen = Math.max(...opts.map(o=>o.length));
  if (minLen < 3 && maxLen > 10) findings.option_too_short.push(i);
  const stem = q.q || q.stem;
  if (stems.has(stem)) findings.duplicates++;
  stems.add(stem);
});
console.log('\nQuality scan:');
console.log('  correct_longest:', findings.correct_longest.length, findings.correct_longest);
console.log('  option_too_short:', findings.option_too_short.length, findings.option_too_short);
console.log('  duplicates:', findings.duplicates);
