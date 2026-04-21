import G from '../core/globals.js';
import { TOPICS, HARRISON_PDF_MAP, APP_VERSION, SYLLABUS_VERSION } from '../core/constants.js';
import { sanitize, heDir, safeJSONParse, toast, isOk} from "../core/utils.js";
import { callAI } from '../ai/client.js';
import { getTopicStats, trackChapterRead, getChaptersDueForReading } from '../sr/spaced-repetition.js';
import { TOPIC_REF } from './track-view.js';
import { submitReport } from '../features/cloud.js';
import { buildPool } from '../quiz/engine.js';

let sylSec='haz';
let _pendingAiQs=null; // temp storage for add-to-bank delegation
const SYL_HAZ_EXCLUDED=new Set([2,3,4,5,6,34,62]);
const SYL_HAZ=[];
const SYL_HAR_ALL=[
{ch:26,t:'Neurologic Causes of Weakness and Paralysis'},
{ch:382,t:'Approach to Articular and Musculoskeletal Disorders'},
{ch:387,t:'Periarticular Disorders of the Extremities'},
{ch:433,t:'Approach to the Patient with Neurologic Disease'},
{ch:436,t:'Seizures and Epilepsy'},
{ch:437,t:'Introduction to Cerebrovascular Diseases'},
{ch:438,t:'Ischemic Stroke'},
{ch:439,t:'Intracerebral Hemorrhage'},
{ch:458,t:'Guillain-Barré Syndrome & Immune-Mediated Neuropathies'},
{ch:459,t:'Myasthenia Gravis & Neuromuscular Junction Diseases'},
];
const SYL_HAR_BASE=[
{ch:14,t:'Pain: Pathophysiology and Management'},
{ch:15,t:'Chest Discomfort'},{ch:16,t:'Abdominal Pain'},
{ch:17,t:'Headache'},{ch:18,t:'Low Back Pain'},
{ch:20,t:'Fever'},{ch:22,t:'Fever of Unknown Origin'},
{ch:30,t:'Coma'},{ch:39,t:'Dyspnea'},
{ch:40,t:'Cough'},{ch:41,t:'Hemoptysis'},
{ch:42,t:'Hypoxia and Cyanosis'},{ch:43,t:'Edema'},
{ch:48,t:'Nausea, Vomiting, and Indigestion'},
{ch:49,t:'Diarrhea and Constipation'},
{ch:50,t:'Unintentional Weight Loss'},
{ch:51,t:'Gastrointestinal Bleeding'},
{ch:52,t:'Jaundice'},{ch:53,t:'Abdominal Swelling and Ascites'},
{ch:55,t:'Azotemia and Urinary Abnormalities'},
{ch:56,t:'Fluid and Electrolyte Disturbances'},
{ch:57,t:'Hypercalcemia and Hypocalcemia'},
{ch:58,t:'Acidosis and Alkalosis'},
{ch:66,t:'Anemia and Polycythemia'},
{ch:67,t:'Disorders of Granulocytes and Monocytes'},
{ch:69,t:'Bleeding and Thrombosis'},
{ch:70,t:'Enlargement of Lymph Nodes and Spleen'},
{ch:79,t:'Infections in Patients with Cancer'},
{ch:80,t:'Oncologic Emergencies'},
{ch:102,t:'Iron Deficiency & Hypo-proliferative Anemias'},
{ch:120,t:'Disorders of Platelets and Vessel Wall'},
{ch:121,t:'Coagulation Disorders'},
{ch:127,t:'Approach to the Acutely Ill Infected Febrile Patient'},
{ch:133,t:'Infective Endocarditis'},
{ch:136,t:'Osteomyelitis'},
{ch:142,t:'Encephalitis'},{ch:143,t:'Meningitis'},
{ch:147,t:'Infections Acquired in Health Care Facilities'},
{ch:243,t:'Approach to Patient with Cardiovascular Disease'},
{ch:247,t:'Electrocardiography'},
{ch:285,t:'NSTEMI & Unstable Angina'},
{ch:286,t:'ST-Segment Elevation Myocardial Infarction'},
{ch:295,t:'Approach to Patient with Respiratory Disease'},
{ch:305,t:'Disorders of the Pleura'},
{ch:311,t:'Approach to the Patient with Critical Illness'},
{ch:314,t:'Approach to the Patient with Shock'},
{ch:315,t:'Sepsis and Septic Shock'},
{ch:316,t:'Cardiogenic Shock and Pulmonary Edema'},
{ch:317,t:'Cardiovascular Collapse, Cardiac Arrest, Sudden Death'},
{ch:319,t:'Approach to Patient with Renal/Urinary Tract Disease'},
{ch:321,t:'Acute Kidney Injury'},
{ch:322,t:'Chronic Kidney Disease'},
{ch:332,t:'Approach to Patient with GI Disease'},
{ch:347,t:'Evaluation of Liver Function'},
{ch:355,t:'Cirrhosis and Its Complications'},
{ch:375,t:'The Vasculitis Syndromes'},
{ch:379,t:'Sarcoidosis'},
{ch:384,t:'Gout & Crystal-Associated Arthropathies'},
{ch:388,t:'Approach to Patient with Endocrine Disorders'},
];
const SYL_LAWS=[];
// P0062-2025 required reading — family medicine (Appendices ב/ג/ד/ה of sources list)
// Source: docs/references/P0062-2025_sources.pdf
const SYL_ARTICLES=[
// Appendix ב' — Patient-Centered Care (מר"ם exam)
{s:'Patient-Centered Care',t:'Patient-Centered Medicine: Transforming the Clinical Method (3rd ed)',j:'Stewart M. et al., 2013 — book'},
{s:'Patient-Centered Care',t:'Patient-centred interviewing I: Understanding patients\' experiences',j:'Weston, Brown, Stewart. Can Fam Physician 1989;35:147-51'},
{s:'Patient-Centered Care',t:'Patient-Centred Interviewing II: Finding Common Ground',j:'Brown, Weston, Stewart. Can Fam Physician 1989;35'},
{s:'Patient-Centered Care',t:'Patient-Centred Interviewing III: Five Provocative Questions',j:'Weston, Brown, Stewart. Can Fam Physician 1989;35:159-61'},
{s:'Patient-Centered Care',t:'The patient-centred clinical method 1: A model for doctor-patient interaction',j:'Levenstein et al. Fam Pract 1986;3(1):24-30'},
{s:'Patient-Centered Care',t:'The Patient-Centred Clinical Method 2: Definition and Application',j:'Brown et al. Fam Pract 1986;3(2):75-79'},
{s:'Patient-Centered Care',t:'Patient-Centered Communication: Basic Skills',j:'Hashim MJ. Am Fam Physician 2017;95(1):29-34'},
{s:'Patient-Centered Care',t:'Calgary-Cambridge Guide to the Medical Interview',j:'https://www.gp-training.net/communication-skills/calgary-cambridge-model/'},
// Appendix ג' — Family
{s:'Family',t:'The Expanded Family Life Cycle (4th ed) — Family Life Cycle Stages (binding)',j:'McGoldrick, Carter, Garcia-Preto — book excerpt'},
{s:'Family',t:'Family-Oriented Primary Care (2nd ed) — Ch 3-5, 11-13, 15-16, 18-20, 22',j:'McDaniel, Campbell, Hepworth, Lorenz — book excerpt'},
{s:'Family',t:'Behavioral Medicine — A Guide for Clinical Practice (4th ed) — Ch 3,4,11-15,19,20',j:'Feldman & Cristensen — book excerpt'},
{s:'Family',t:'Five Areas of Questioning to Promote a Family-Oriented Approach in Primary Care',j:'Cole-Kelly, Seaburn. Fam Syst Health 1999;17(3):341-48'},
{s:'Family',t:'Developmental levels in Family-centered medical care',j:'Doherty, Baird. Fam Med 1986;18(3):153-6'},
{s:'Family',t:'Chronic Illness and the Life Cycle: A Conceptual Framework',j:'Rolland JS. Fam Process 1987;26:203-21'},
{s:'Family',t:'Using Triangulation Concepts to Understand the Doctor-Patient-Family Relationship',j:'Shapiro J. Fam Syst Health 2001;19:203-10'},
{s:'Family',t:'Interviewing When Family Members are Present',j:'Lang F et al. Am Fam Physician 2002;65:1351-4'},
// Appendix ד' — EBM (JAMA Users\' Guides)
{s:'EBM',t:'Users\' guides to the medical literature (intro)',j:'JAMA 1993;270(17):2096-7'},
{s:'EBM',t:'Users\' Guides I: How to get started',j:'JAMA 1993;270(17):2093-5'},
{s:'EBM',t:'Users\' Guides II: Therapy/prevention — A. Are results valid?',j:'JAMA 1993;270(21):2598-601'},
{s:'EBM',t:'Users\' Guides II: Therapy/prevention — B. What are results, will they help?',j:'JAMA 1994;271(1):59-63'},
{s:'EBM',t:'Users\' Guides III: Diagnostic test — A. Are results valid?',j:'JAMA 1994;271(5):389-91'},
{s:'EBM',t:'Users\' Guides III: Diagnostic test — B. What are results, will they help?',j:'JAMA 1994;271(9):703-7'},
{s:'EBM',t:'Users\' Guides IV: How to use an article about harm',j:'JAMA 1994;271(20):1615-9'},
{s:'EBM',t:'Users\' Guides VI: How to use an overview',j:'JAMA 1994;272(17):1367-71'},
{s:'EBM',t:'EBM knowledge summary',j:'http://www.ebm.med.ualberta.ca/ebm.html'},
// Appendix ה' — Israeli Guidelines / הנחיות הר"י (ordered newest → oldest)
{s:'Israeli Guidelines 2025',t:'הנחיות טיפול בשבץ מוח',j:'הר"י 2025'},
{s:'Israeli Guidelines 2025',t:'יתר לחץ דם כרוני בהריון',j:'הר"י 2025'},
{s:'Israeli Guidelines 2025',t:'יתר לחץ דם ורעלת בהריון',j:'הר"י 2025'},
{s:'Israeli Guidelines 2024',t:'ניהול מעקב אישה הרה בהריון בסיכון נמוך',j:'הר"י 2024'},
{s:'Israeli Guidelines 2024',t:'אבחון וטיפול במחלת הכבד השומני',j:'הר"י 2024'},
{s:'Israeli Guidelines 2024',t:'טיפול באנמיה בהיריון ומשכב לידה',j:'הר"י 2024'},
{s:'Israeli Guidelines 2023',t:'טיפול בדמנציה (Dementia) ומניעתה',j:'הר"י 2023'},
{s:'Israeli Guidelines 2023',t:'אבחון וטיפול בדלקת ריאות הנרכשת בקהילה בילדים',j:'הר"י 2023'},
{s:'Israeli Guidelines 2023',t:'אבחון וטיפול בדלקת אוזן תיכונה בילדים',j:'הר"י 2023'},
{s:'Israeli Guidelines 2023',t:'אבחון וטיפול בזיהום בדרכי השתן בילדים',j:'הר"י 2023 (עדכון)'},
{s:'Israeli Guidelines 2023',t:'דלקות בדרכי השתן בהיריון',j:'הר"י 2023'},
{s:'Israeli Guidelines 2023',t:'סוכרת היריונית',j:'הר"י 2023'},
{s:'Israeli Guidelines 2023',t:'האבחנה והטיפול בזיהומי עור חידקיים שכיחים בילדים',j:'הר"י 2023'},
{s:'Israeli Guidelines 2023',t:'אבחון מניעה וטיפול בסיבוכי קרישיות יתר בהיריון',j:'הר"י 2023'},
{s:'Israeli Guidelines 2023',t:'שימוש בקנאביס לטיפול בכאב',j:'הר"י 2023'},
{s:'Israeli Guidelines 2023',t:'המלצות לאבחון ולטיפול בגסטרואנטריטיס חדה בילדים בישראל',j:'הר"י 2023'},
{s:'Israeli Guidelines 2023',t:'חשיפה למסכים ובריאות הילדים',j:'הר"י 2023'},
{s:'Israeli Guidelines 2023',t:'שימוש במכשירי התראה למניעת מוות פתאומי לא מוסבר של תינוקות',j:'הר"י 2023'},
{s:'Israeli Guidelines 2023',t:'קווים מנחים להזרקת חומר ניגוד מבוסס יוד - רגישויות',j:'הר"י 2023'},
{s:'Israeli Guidelines 2023',t:'קווים מנחים להזרקת חומר ניגוד מבוסס יוד - מחלה כלייתית',j:'הר"י 2023'},
{s:'Israeli Guidelines 2023',t:'אבחון, טיפול ומניעה של GI לפני/אחרי ניתוחים בריאטריים',j:'הר"י 2023'},
{s:'Israeli Guidelines 2023',t:'טיפול בזיהומים ומניעתם בילדים חסרי טחול (אספלניה/היפוספלניזם)',j:'הר"י 2023'},
{s:'Israeli Guidelines 2022',t:'חיסון נגד HPV',j:'הר"י 2022'},
{s:'Israeli Guidelines 2022',t:'הערכת בריאות קוגניטיבית והתייחסות ל-MCI',j:'הר"י 2022'},
{s:'Israeli Guidelines 2022',t:'הטיפול בתסמונת המעי הרגיש',j:'הר"י 2022'},
{s:'Israeli Guidelines 2022',t:'הטיפול בנגעים טרום סרטניים של צוואר הרחם',j:'הר"י 2022'},
{s:'Israeli Guidelines 2022',t:'הורדת חום בילדים',j:'הר"י 2022'},
{s:'Israeli Guidelines 2022',t:'מעקב במהלך משכב הלידה',j:'הר"י 2022'},
{s:'Israeli Guidelines 2022',t:'מעקב אמבולטורי אחר תינוקות לאחר צהבת ילודים',j:'הר"י 2022'},
{s:'Israeli Guidelines 2022',t:'הנחיות לטיפול בשבץ מוחי',j:'הר"י 2022'},
{s:'Israeli Guidelines 2022',t:'הסכנות בחשיפת ילדים לקנאביס',j:'הר"י 2022'},
{s:'Israeli Guidelines 2022',t:'חינוך לבריאות מינית',j:'הר"י 2022'},
{s:'Israeli Guidelines 2022',t:'ניהול הריון שלאחר המועד',j:'הר"י 2022'},
{s:'Israeli Guidelines 2022',t:'תבחיני נשיפה - אי סבילות לסוכרים / SIBO',j:'הר"י 2022'},
{s:'Israeli Guidelines 2021',t:'הנחיות ישראליות לטיפול בדיסליפידמיה',j:'הר"י 2021'},
{s:'Israeli Guidelines 2021',t:'הנחיות לביצוע אולטרא סאונד בהריון',j:'הר"י 2021'},
{s:'Israeli Guidelines 2021',t:'הטיפול באישה בגיל המעבר',j:'הר"י 2021'},
{s:'Israeli Guidelines 2021',t:'הפלות חוזרות',j:'הר"י 2021'},
{s:'Israeli Guidelines 2021',t:'מניעה של HPV במטופלים עם דיכוי חיסוני',j:'הר"י 2021'},
{s:'Israeli Guidelines 2021',t:'ניתוח מטבולי - הפתרון הכירורגי לסכרת סוג 2',j:'הר"י 2021'},
{s:'Israeli Guidelines 2020',t:'הגישה לישנוניות יתר במתבגרים',j:'הר"י 2020'},
{s:'Israeli Guidelines 2020',t:'הנחיות קליניות לטיפול בילד הבריא חלק א',j:'הר"י 2020'},
{s:'Israeli Guidelines 2020',t:'תוספי תזונה והרגלים בהריון',j:'הר"י 2020'},
{s:'Israeli Guidelines 2020',t:'טיפול בפסוריאזיס',j:'הר"י 2020'},
{s:'Israeli Guidelines 2020',t:'הנחיות לטיפול בדלקת עור אטופית',j:'הר"י 2020'},
{s:'Israeli Guidelines 2020',t:'אבחנה וטיפול בזיהומי עור פטריתיים בילדים',j:'הר"י 2020'},
{s:'Israeli Guidelines 2020',t:'ליסטריה בהריון',j:'הר"י 2020'},
{s:'Israeli Guidelines 2020',t:'מניעת ריגוש לאנטיגן D בנשים הרות',j:'הר"י 2020'},
{s:'Israeli Guidelines 2020',t:'בדיקות BRCA1/2 לחולי סרטן שד, שחלה ולבלב',j:'הר"י 2020'},
{s:'Israeli Guidelines 2020',t:'כיבוי דפיברילטור מושתל',j:'הר"י 2020'},
{s:'Israeli Guidelines 2020',t:'הגישה לתינוק הסובל מדימום לאחר ברית מילה',j:'הר"י 2020'},
{s:'Israeli Guidelines 2020',t:'אשפוזי בית כתחליף אשפוז במחלקות פנימיות',j:'הר"י 2020'},
{s:'Israeli Guidelines 2020',t:'אבחון וטיפול בדלקת נגיפית C למיגור המחלה בישראל',j:'הר"י 2020'},
{s:'Israeli Guidelines 2019',t:'הערכה וטיפול הפרעה בתפקוד המיני + חסר בטסטוסטרון',j:'הר"י 2019'},
{s:'Israeli Guidelines 2019',t:'אבחון וטיפול ביתר לחץ דם במבוגרים',j:'הר"י 2019'},
{s:'Israeli Guidelines 2019',t:'הליקובקטר פילורי - קוים מנחים לגישה וטיפול',j:'הר"י 2019'},
{s:'Israeli Guidelines 2019',t:'פעילות גופנית וספורט בילדים ובני נוער',j:'הר"י 2019'},
{s:'Israeli Guidelines 2019',t:'טיפול בכאב בהריון והנקה',j:'הר"י 2019'},
{s:'Israeli Guidelines 2019',t:'מניעת השימוש באלכוהול בקרב בני נוער',j:'הר"י 2019'},
{s:'Israeli Guidelines 2019',t:'הטיפול התרופתי בכאב בחולה האונקולוגי המבוגר',j:'הר"י 2019'},
{s:'Israeli Guidelines 2019',t:'חיסונים והריון',j:'הר"י 2019'},
{s:'Israeli Guidelines 2019',t:'משטח מצוואר הרחם וסריקה לגילוי מוקדם',j:'הר"י 2019'},
{s:'Israeli Guidelines 2019',t:'טיפול ב-Mebendazole ב-Enterobiasis בילדים <2',j:'הר"י 2019'},
{s:'Israeli Guidelines 2018',t:'הערכה וטיפול - תפקוד מיני + טסטוסטרון בגברים',j:'הר"י 2018'},
];
// renderSyllabus removed — dead code (89 lines)

// ===== TOPIC PRIORITY MATRIX (added to Track G.tab) =====

// Library — wrong answer log, Harrison reader, renderLibrary, laws, articles, exams

export function renderWrongAnswerLog(){
  const TOPICS_L=TOPICS;
  // Get chronically failing + recently answered wrong questions
  const chronic=[];const recentWrong=[];
  Object.entries(G.S.sr||{}).forEach(([idx,s])=>{
    const q=G.QZ[+idx];if(!q)return;
    if(s.tot>=4&&s.ok/s.tot<0.35)chronic.push({idx:+idx,q,s});
    else if(s.n===0&&s.tot>=1)recentWrong.push({idx:+idx,q,s});
  });
  chronic.sort((a,b)=>a.s.ok/a.s.tot-b.s.ok/b.s.tot);
  recentWrong.sort((a,b)=>(b.s.ts?.slice(-1)[0]||0)-(a.s.ts?.slice(-1)[0]||0));

  let h='';
  // Summary + action
  const totalProblem=chronic.length+recentWrong.length;
  if(totalProblem>0){
    h+=`<div style="padding:10px 12px;background:#f1f5f9;border-radius:10px;margin-bottom:10px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
<div style="flex:1;font-size:11px;color:#475569;line-height:1.5"><b style="color:#0f172a">${totalProblem}</b> שאלות דורשות חזרה · ${chronic.length} כרוניות · ${recentWrong.length} אחרונות</div>
<button class="btn btn-p" style="font-size:11px;padding:8px 14px;min-height:36px" data-action="retry-wrong" aria-label="Retry wrong questions">🔄 תרגל הכל</button>
</div>`;
  }

  // Chronic failures
  if(chronic.length>0){
    h+=`<div style="font-weight:700;font-size:11px;margin-bottom:6px;color:#dc2626">🔴 כישלונות כרוניים — קרא את הפרק, אל תתרגל</div>`;
    chronic.slice(0,5).forEach(({idx,q,s})=>{
      const acc=Math.round(s.ok/s.tot*100);
      const topic=q.ti>=0?TOPICS_L[q.ti]:'';
      h+=`<div style="padding:8px;background:#fef2f2;border-radius:8px;margin-bottom:6px;cursor:pointer" data-action="goto-q" data-idx="${idx}" data-flip="1">
<div style="font-size:10px;font-weight:600;line-height:1.4" dir="${heDir(q.q)}">${q.q.slice(0,80)}${q.q.length>80?'…':''}</div>
<div style="display:flex;gap:8px;margin-top:4px"><span style="font-size:9px;color:#dc2626">${s.ok}/${s.tot} (${acc}%) · D=${s.fsrsD?s.fsrsD.toFixed(1):'?'}</span><span style="font-size:9px;color:#94a3b8">${topic}</span></div>
</div>`;
    });
  }

  // Recently wrong
  const shown=recentWrong.slice(0,8);
  if(shown.length>0){
    h+=`<div style="font-weight:700;font-size:11px;margin-bottom:6px;margin-top:10px;color:#d97706">⚠️ טעויות אחרונות</div>`;
    shown.forEach(({idx,q,s})=>{
      const topic=q.ti>=0?TOPICS_L[q.ti]:'';
      h+=`<div style="padding:8px;background:#fffbeb;border-radius:8px;margin-bottom:4px;cursor:pointer" data-action="goto-q" data-idx="${idx}">
<div style="font-size:10px;line-height:1.4" dir="${heDir(q.q)}">${q.q.slice(0,75)}${q.q.length>75?'…':''}</div>
<div style="font-size:9px;color:#94a3b8;margin-top:2px">${topic}</div>
</div>`;
    });
  }

  if(!chronic.length&&!shown.length)h+='<div style="font-size:11px;color:#94a3b8;text-align:center;padding:20px">עדיין אין נתונים — ענה על כמה שאלות תחילה</div>';
  return h;
}
export function toggleHarrisonAI(){
  const b=document.getElementById('harrison-ai-box');
  if(b)b.style.display=b.style.display==='none'?'block':'none';
}
export async function submitHarrisonAI(){
  const q=document.getElementById('harrison-ai-q')?.value?.trim();
  const ans=document.getElementById('harrison-ai-answer');
  if(!q||!ans)return;
  ans.style.display='block';ans.innerHTML='⏳ ...';
  const prompt=`You are an expert family physician helping an Israeli family medicine resident study Harrison's Internal Medicine 22e (cross-reference only — primary source is Goroll 8e) for the שלב א׳ family medicine board exam (P0062-2025).

Question: ${q}

Answer in HEBREW (4-6 sentences). Cite the relevant Goroll/Harrison chapter if known. Focus on primary-care family medicine principles and what the שלב א׳ רפואת המשפחה exam is likely to test. If a specific threshold/criterion/number is asked, lead with it.`;
  try{
    const txt=await callAI([{role:'user',content:prompt}],600,'sonnet');
    ans.innerHTML=sanitize(txt);
    document.getElementById('harrison-ai-q').value='';
  }catch(e){ans.innerHTML='⚠️ Failed: '+sanitize(e.message);}
}
export async function aiSummarizeChapter(chNum,chTitle){
  const box=document.getElementById('quiz-me-box');
  if(!box)return;
  box.innerHTML='<div style="text-align:center;padding:16px;color:#64748b">⏳ מסכם את הפרק...</div>';
  let chText='';
  const harCh=G._harData&&G._harData[chNum];
  if(harCh&&harCh.sections){
    chText=harCh.sections.slice(0,8).map(s=>{
      const body=Array.isArray(s.content)?s.content.join(' '):(s.content||'');
      return s.title+(body?': '+body.slice(0,300):'');
    }).join('\n').slice(0,3500);
  }
  const prompt=`You are summarizing Goroll's Primary Care Medicine / Harrison Ch ${chNum}: ${chTitle} for the Israeli family medicine board exam (שלב א׳ רפואת משפחה).

Chapter content:
${chText||'Chapter '+chNum+': '+chTitle}

Create a board-focused summary in HEBREW with:
1. 5-7 key facts/thresholds the examiner will test (specific numbers, criteria)
2. 2-3 "exam traps" — common wrong answers and why they're wrong
3. One clinical pearl for family medicine / primary-care practice

Format as clean bullet points. Be concise and high-yield.`;
  try{
    const txt=await callAI([{role:'user',content:prompt}],800,'sonnet');
    box.innerHTML=`<div style="margin-top:12px;padding:14px;background:#f0fdf4;border-radius:10px;border-left:4px solid #059669">
<div style="font-weight:700;font-size:12px;color:#065f46;margin-bottom:8px">📝 Board Summary — Ch ${sanitize(String(chNum))}: ${sanitize(chTitle)}</div>
<div style="font-size:11px;line-height:1.8;direction:rtl;text-align:right;white-space:pre-wrap">${sanitize(txt)}</div>
</div>`;
  }catch(e){box.innerHTML='<div style="color:#dc2626;font-size:11px;padding:8px">⚠️ Failed: '+sanitize(e.message)+'</div>';}
}
// toggleAskAI removed — dead code
// submitAskAI removed — dead code
export async function quizMeOnChapter(chNum,chTitle){
  // Show loading state in Library
  const el=document.getElementById('quiz-me-box');
  // safe-innerhtml: chNum is always an integer from parseInt() / G.harChOpen — no user input path.
  if(el){el.innerHTML='<div style="text-align:center;padding:20px;color:#64748b">⏳ Generating questions from Ch '+chNum+'...</div>';}
  // Get chapter text from already-loaded data
  let chapterText='';
  const harCh=G._harData&&G._harData[chNum];
  if(harCh&&harCh.sections){
    chapterText=harCh.sections.slice(0,6).map(s=>{
      const body=Array.isArray(s.content)?s.content.join(' '):(s.content||'');
      return s.title+': '+body;
    }).join('\n').slice(0,3000);
  }
  if(!chapterText){
    chapterText="Textbook Chapter "+chNum+": "+chTitle;
  }
  const prompt=`You are an Israeli family medicine board examiner writing MCQ for the שלב א׳ רפואת המשפחה exam (P0062-2025).

Based on this chapter content from Ch ${chNum} (${chTitle}):
${chapterText}

Generate 3 original MCQ questions NOT already in the question bank. Each question must:
1. Test a specific fact, threshold, or mechanism from this chapter
2. Have exactly 5 answer options (A-E)
3. Have one definitively correct answer
4. Include a brief Hebrew explanation (2-3 sentences)

Return ONLY valid JSON array:
[{"q":"question text","o":["A. opt","B. opt","C. opt","D. opt","E. opt"],"c":0,"e":"הסבר בעברית"}]
c = 0-based index of correct answer. No markdown, no preamble.`;
  try{
    const txt=await callAI([{role:'user',content:prompt}],1200,'sonnet');
    const clean=txt.replace(/\`\`\`json|\`\`\`/g,'').trim();
    const qs=JSON.parse(clean);
    // Display the generated questions
    let h='<div style="margin-top:16px;border-top:2px solid #7c3aed;padding-top:12px">';
    h+='<div style="font-weight:700;font-size:12px;color:#7c3aed;margin-bottom:10px">🧠 AI-Generated Questions — Ch '+sanitize(String(chNum))+': '+sanitize(chTitle)+'</div>';
    qs.forEach((q,idx)=>{
      h+=`<div style="margin-bottom:14px;padding:12px;background:#faf5ff;border-radius:10px;border-left:3px solid #7c3aed">`;
      h+=`<div style="font-size:12px;font-weight:600;margin-bottom:8px" dir="${heDir(q.q)}">${idx+1}. ${sanitize(q.q)}</div>`;
      q.o.forEach((opt,oi)=>{
        const isCorrect=isOk(q,oi);
        h+=`<div style="font-size:11px;padding:4px 8px;margin-bottom:3px;border-radius:6px;background:${isCorrect?'#dcfce7':'#f8fafc'};color:${isCorrect?'#166534':'#475569'};font-weight:${isCorrect?'700':'400'}">${sanitize(opt)}${isCorrect?' ✓':''}</div>`;
      });
      if(q.e)h+=`<div style="font-size:10px;color:#6d28d9;margin-top:8px;text-align:right;line-height:1.6;border-top:1px solid #e9d5ff;padding-top:6px;unicode-bidi:plaintext" dir="${heDir(q.e)}">💡 ${sanitize(q.e)}</div>`;
      h+='</div>';
    });
    _pendingAiQs=JSON.stringify(qs);h+='<button data-action="add-qs" style="font-size:10px;padding:6px 14px;background:#059669;color:#fff;border:none;border-radius:8px;cursor:pointer;margin-top:4px">➕ Add to my question bank</button>';
    h+='</div>';
    if(el)el.innerHTML=h;
  }catch(e){
    if(el)el.innerHTML='<div style="color:#dc2626;font-size:11px;padding:8px">⚠️ Failed to generate: '+sanitize(e.message)+'</div>';
  }
}
export function addChapterQsToBank(jsonStr){
  try{
    const qs=JSON.parse(jsonStr);
    const existing=JSON.parse(localStorage.getItem('mishpacha_custom_qs')||'[]');
    qs.forEach(q=>{q.t='AI-Ch';q.ti=-1;existing.push(q);});
    localStorage.setItem('mishpacha_custom_qs',JSON.stringify(existing));
    toast('✅ '+qs.length+' questions added! Reload to see them in the AI-Ch filter.','info');
  }catch(e){toast('Failed: '+e.message,'info');}
}
export function renderLibrary(){
let h=`<div class="sec-t">📖 Library</div>
<div class="sec-s">Goroll 8e · Nelson 22e · Harrison 22e · Articles · Past Exams</div>`;
// Sub-tabs
const libTabs=[
{id:'goroll',l:'📘 Goroll',c:'#d97706'},
{id:'nelson',l:'👶 Nelson',c:'#059669'},
{id:'harrison',l:'📗 Harrison',c:'#8b5cf6'},
{id:'articles',l:'📄 Articles',c:'#3b82f6'},
{id:'exams',l:'📝 Exams',c:'#06b6d4'}
];
// Default to Goroll on first render (Harrison was the default — wrong for family med)
if(!G.libSec||G.libSec==='syllabus'||G.libSec==='laws')G.libSec='goroll';
h+=`<div style="display:flex;gap:4px;overflow-x:auto;padding:4px 0;margin-bottom:12px;-webkit-overflow-scrolling:touch">`;
libTabs.forEach(t=>{
h+=`<span class="pill ${G.libSec===t.id?'on':''}" style="white-space:nowrap;font-size:10px" data-action="lib-section" data-sec="${t.id}">${t.l}</span>`;
});
h+=`</div>`;

// ===== GOROLL 8e — PDF fragment reader (239 chapters) =====
if(G.libSec==='goroll'){
if(!G._gorollData){
  fetch('goroll_chapters.json').then(r=>r.json()).then(d=>{G._gorollData=d;G.render();}).catch(e=>console.error('Goroll load failed',e));
  h+=`<div class="card" style="padding:40px;text-align:center"><div style="font-size:13px;color:#64748b">⏳ Loading Goroll chapters...</div></div>`;
}else{
h+=`<div class="card" style="padding:14px">
<div style="font-size:13px;font-weight:700;margin-bottom:4px">📘 Goroll — Primary Care Medicine 8e</div>
<div style="font-size:10px;color:#64748b;margin-bottom:12px">${G._gorollData.length} chapters · PRIMARY textbook for P0062-2025 · tap to open PDF at chapter page</div>`;
G._gorollData.forEach(c=>{
const pageLen=c.end_page?(c.end_page-c.page+1):null;
h+=`<a href="goroll/Goroll_8e.pdf#page=${c.page}" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #f1f5f9;text-decoration:none;color:inherit">
<span style="background:#d97706;color:#fff;font-size:10px;font-weight:700;padding:4px 8px;border-radius:8px;min-width:42px;text-align:center">Ch ${c.num}</span>
<div style="flex:1;min-width:0">
<div style="font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.title}</div>
<div style="font-size:9px;color:#94a3b8;margin-top:2px">p.${c.page}${pageLen?' · ~'+pageLen+' pages':''}</div>
</div>
<span style="font-size:18px;color:#94a3b8">›</span></a>`;
});
h+=`</div>`;
}
}

// ===== NELSON 22e — syllabus chapter index (PDF too large to bundle; Drive link stays primary) =====
else if(G.libSec==='nelson'){
if(!G._nelData){
  fetch('nelson_chapters.json').then(r=>r.json()).then(d=>{G._nelData=d;G.render();}).catch(e=>console.error('Nelson load failed',e));
  h+=`<div class="card" style="padding:40px;text-align:center"><div style="font-size:13px;color:#64748b">⏳ Loading Nelson chapters...</div></div>`;
}else{
const nq=(G.nelSearch||'').trim().toLowerCase();
const filtered=nq?G._nelData.filter(c=>c.title_en.toLowerCase().includes(nq)||String(c.ch).includes(nq)):G._nelData;
h+=`<div class="card" style="padding:14px">
<div style="font-size:13px;font-weight:700;margin-bottom:4px">👶 Nelson Textbook of Pediatrics 22e</div>
<div style="font-size:10px;color:#64748b;margin-bottom:10px">${G._nelData.length} chapters from P0062-2025 Appendix א' · cross-reference to Goroll peds · PDF (167 MB) opens in Google Drive</div>
<a href="https://drive.google.com/file/d/1KK7xcN5JHgo8LVUpppHvxlZrg3Ol4VnU/view" target="_blank" rel="noopener" style="display:inline-block;font-size:11px;font-weight:600;color:#fff;background:#059669;padding:8px 14px;border-radius:8px;text-decoration:none;margin-bottom:12px">→ Open full Nelson 22e PDF (Drive)</a>
<input type="search" placeholder="🔎 Search chapter title or number (e.g. asthma, 112)" data-action="nel-search" value="${sanitize(G.nelSearch||'')}" style="width:100%;padding:8px 10px;font-size:12px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:10px;box-sizing:border-box" dir="auto">
<div style="font-size:9px;color:#94a3b8;margin-bottom:4px">${filtered.length===G._nelData.length?`All ${G._nelData.length} chapters`:`${filtered.length} of ${G._nelData.length} chapters`}</div>`;
if(filtered.length===0){
  h+=`<div style="padding:20px;text-align:center;font-size:11px;color:#94a3b8">No chapters match "${sanitize(G.nelSearch||'')}".</div>`;
}else{
  filtered.forEach(c=>{
    h+=`<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #f1f5f9">
<span style="background:#059669;color:#fff;font-size:10px;font-weight:700;padding:4px 8px;border-radius:8px;min-width:42px;text-align:center">Ch ${c.ch}</span>
<div style="flex:1;min-width:0;font-size:12px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${sanitize(c.title_en)}</div>
</div>`;
  });
}
h+=`</div>`;
}
}

// ===== HARRISON IN-APP READER (family-med relevant chapters only) =====
else if(G.libSec==='harrison'){
if(G.harChOpen!==null&&G._harData&&G._harData[String(G.harChOpen)]){
const ch=G._harData[String(G.harChOpen)];
const allSylChNums=[...SYL_HAR_ALL,...SYL_HAR_BASE].map(c=>c.ch).sort((a,b)=>a-b);
const curIdx=allSylChNums.indexOf(G.harChOpen);
const prevCh=curIdx>0?allSylChNums[curIdx-1]:null;
const nextCh=curIdx<allSylChNums.length-1?allSylChNums[curIdx+1]:null;
h+=`<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap">
<button data-action="close-chapter" style="background:#f1f5f9;border:none;border-radius:8px;padding:6px 12px;font-size:11px;cursor:pointer">← Back</button>
<div style="font-size:12px;font-weight:700;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Ch ${G.harChOpen}: ${ch.title}</div>
</div>
<div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap">
${prevCh?`<button data-action="open-chapter" data-ch="${prevCh}" style="font-size:10px;padding:5px 10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;cursor:pointer">‹ Ch ${prevCh}</button>`:''}
<button data-action="quiz-chapter" style="font-size:10px;padding:5px 10px;background:#7c3aed;color:#fff;border:none;border-radius:8px;cursor:pointer">🧠 Quiz</button>
<button data-action="summarize-chapter" style="font-size:10px;padding:5px 10px;background:#059669;color:#fff;border:none;border-radius:8px;cursor:pointer">📝 Summary</button>
${nextCh?`<button data-action="open-chapter" data-ch="${nextCh}" style="font-size:10px;padding:5px 10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;cursor:pointer">Ch ${nextCh} ›</button>`:''}
</div>
<div id="quiz-me-box"></div>
<div class="card" style="padding:16px">`;
// Feature 4: Show question stats for this topic in chapter reader
const _relTopics=Object.entries(TOPIC_REF).filter(([ti,ref])=>ref.s==='har').map(([ti])=>+ti);
const _chTopicIdx=_relTopics.find(ti=>{const ref=TOPIC_REF[ti];return ref&&String(ref.ch)===String(G.harChOpen);});
if(_chTopicIdx!==undefined){
const _ts=getTopicStats()[_chTopicIdx]||{ok:0,no:0,tot:0};
const _tpct=_ts.tot?Math.round(_ts.ok/_ts.tot*100):null;
const _tqCount=G.QZ.filter(q=>q.ti===_chTopicIdx).length;
h+=`<div style="display:flex;gap:8px;margin-bottom:12px;padding:8px 12px;background:#f5f3ff;border-radius:10px;font-size:10px;align-items:center">
<span>📝 ${_tqCount} questions on this topic</span>
${_tpct!==null?`<span style="font-weight:700;color:${_tpct>=70?'#059669':_tpct>=50?'#d97706':'#dc2626'}">${_tpct}% accuracy</span>`:'<span style="color:#94a3b8">Not attempted yet</span>'}
<button data-action="drill-topic" data-ti="${_chTopicIdx}" style="margin-left:auto;font-size:10px;padding:4px 10px;background:#7c3aed;color:#fff;border:none;border-radius:6px;cursor:pointer">▶ Drill</button>
</div>`;
}
ch.sections.forEach(sec=>{
if(sec.title){h+=`<div style="font-size:13px;font-weight:800;color:#7c3aed;margin:18px 0 8px;padding-bottom:4px;border-bottom:2px solid #ede9fe">${sec.title}</div>`;}
sec.content.forEach(p=>{h+=`<p style="font-size:11.5px;line-height:1.9;color:#1e293b;margin:0 0 10px;text-align:justify">${p}</p>`;});
});
h+=`</div>`;
}else if(G._harLoading){
h+=`<div class="card" style="padding:40px;text-align:center"><div style="font-size:13px;color:#64748b">⏳ Loading Harrison's chapter...</div></div>`;
}else{
const allSylChs=[...SYL_HAR_ALL,...SYL_HAR_BASE].sort((a,b)=>a.ch-b.ch);
const allChNums=SYL_HAR_ALL.map(c=>c.ch);
h+=`<div class="card" style="padding:14px">
<div style="font-size:13px;font-weight:700;margin-bottom:4px">📗 Harrison's 22e — Cross-Reference</div>
<div style="padding:8px 10px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;font-size:10px;color:#854d0e;line-height:1.6;margin-bottom:10px">⚠️ For P0062-2025 (Family Medicine), the <b>primary textbook is Goroll 8e</b>. Harrison is a cross-reference only — use it to dig deeper on specialist topics, not as the main study source.</div>
<div style="font-size:10px;color:#64748b;margin-bottom:12px">${allSylChs.length} chapters · <span style="color:#7c3aed">purple</span> = all examinees · <span style="color:#06b6d4">teal</span> = base track only</div>`;
allSylChs.forEach(c=>{
const isAll=allChNums.includes(c.ch);
const harCh=G._harData&&G._harData[String(c.ch)];
const wc=harCh?`~${Math.round(harCh.wordCount/250)} min`:'tap to load';
h+=`<div data-action="open-chapter" data-ch="${c.ch}" style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #f1f5f9;cursor:pointer">
<span style="background:${isAll?'#7c3aed':'#06b6d4'};color:#fff;font-size:10px;font-weight:700;padding:4px 8px;border-radius:8px;min-width:42px;text-align:center">Ch ${c.ch}</span>
<div style="flex:1;min-width:0">
<div style="font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.t}</div>
<div style="font-size:9px;color:#94a3b8;margin-top:2px">${wc}</div>
</div>
<span style="font-size:18px;color:#94a3b8">›</span></div>`;
});
h+=`</div>`;
}
}

// ===== LAWS =====
if(G.libSec==='laws'){
h+=`<div class="card" style="padding:14px">
<div style="font-size:13px;font-weight:700;margin-bottom:4px">⚖️ חוקים, נהלים ופרסומים</div>
<div class="heb" style="font-size:10px;color:#64748b;margin-bottom:10px">${SYL_LAWS.length} items</div>`;
SYL_LAWS.forEach((l,i)=>{
h+=`<div class="heb" style="padding:8px 0;border-bottom:1px solid #f1f5f9">
<div style="display:flex;align-items:flex-start;gap:8px">
<span style="background:#f59e0b;color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:8px;flex-shrink:0">${i+1}</span>
<div style="flex:1"><div style="font-size:11px;font-weight:600">${l.n}</div>
<div style="font-size:9px;color:#94a3b8;margin-top:2px">${l.s}</div></div>${l.f?`<a href="${l.f}" target="_blank" style="font-size:10px;padding:3px 7px;background:#fffbeb;color:#d97706;border-radius:6px;text-decoration:none;flex-shrink:0;white-space:nowrap">📄</a>`:''}</div></div>`;
});
h+=`</div>`;
}

// ===== ARTICLES =====
if(G.libSec==='articles'){
// Group by section
const _sections={};
SYL_ARTICLES.forEach(a=>{const s=a.s||'Other';(_sections[s]=_sections[s]||[]).push(a);});
const _sectionOrder=['Patient-Centered Care','Family','EBM','Israeli Guidelines 2025','Israeli Guidelines 2024','Israeli Guidelines 2023','Israeli Guidelines 2022','Israeli Guidelines 2021','Israeli Guidelines 2020','Israeli Guidelines 2019','Israeli Guidelines 2018'];
h+=`<div class="card" style="padding:14px">
<div style="font-size:13px;font-weight:700;margin-bottom:4px">📄 Required Reading — P0062-2025</div>
<div style="font-size:10px;color:#64748b;margin-bottom:10px">${SYL_ARTICLES.length} items · Appendices ב'/ג'/ד'/ה' of the official sources list</div>
<div style="font-size:10px;color:#64748b;background:#fef3c7;padding:8px;border-radius:6px;margin-bottom:12px;line-height:1.5">
<b>AFP review articles:</b> the syllabus also requires relevant AFP articles published in the last 7 years (up to 12 months before the exam). That list is dynamic — browse at <a href="https://www.aafp.org/afp" target="_blank" rel="noopener" style="color:rgb(var(--sky))">aafp.org/afp</a> filtered by syllabus topic.
</div>`;
let _idx=0;
_sectionOrder.forEach(sec=>{
  const items=_sections[sec]; if(!items||!items.length)return;
  h+=`<div style="font-size:11px;font-weight:700;color:rgb(var(--sky));margin:10px 0 4px">${sec} (${items.length})</div>`;
  items.forEach(a=>{
    _idx++;
    const isUrl=a.j&&a.j.startsWith('http');
    h+=`<div style="padding:6px 0;border-bottom:1px solid #f1f5f9">
<div style="font-size:11px;font-weight:600;line-height:1.5">${_idx}. ${a.t}</div>
<div style="font-size:9px;color:#64748b;margin-top:2px">${isUrl?`<a href="${a.j}" target="_blank" rel="noopener" style="color:rgb(var(--sky))">${a.j}</a>`:a.j}</div></div>`;
  });
});
h+=`</div>`;
}

// ===== EXAMS =====
if(G.libSec==='exams'){
const examYears=[...new Set(G.QZ.map(q=>q.t))].sort();
h+=`<div class="card" style="padding:14px">
<div style="font-size:13px;font-weight:700;margin-bottom:4px">📝 Past Exams in Question Bank</div>
<div style="font-size:10px;color:#64748b;margin-bottom:10px">${G.QZ.length} questions from ${examYears.length} exam sessions</div>`;
examYears.forEach(yr=>{
const cnt=G.QZ.filter(q=>q.t===yr).length;
h+=`<div data-action="filter-year" data-yr="${yr}" style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #f1f5f9;cursor:pointer">
<span style="background:#06b6d4;color:#fff;font-size:10px;font-weight:700;padding:4px 10px;border-radius:8px;min-width:60px;text-align:center">${yr}</span>
<span style="font-size:11px;flex:1">${cnt} questions</span>
<span style="font-size:14px;color:#94a3b8">›</span></div>`;
});
h+=`</div>`;
}

h+=`<div style="text-align:center;margin-top:12px;font-size:9px;color:#94a3b8">
<a href="docs/references/syllabus_curriculum_v2.2.pdf" target="_blank" style="color:rgb(var(--sky));text-decoration:underline">P0062-2025 Syllabus ↗</a> · <a href="docs/references/P0062-2025_sources.pdf" target="_blank" style="color:rgb(var(--sky));text-decoration:underline">Required Sources ↗</a></div>`;
h+=`<div style="text-align:center;margin-top:8px;padding:8px;font-size:9px;color:#94a3b8;line-height:1.5">
صدقة جارية الى من نحب<br>Ceaseless Charity — To the People That We Love</div>`;
return h;
}



export async function openHarrisonChapter(ch){
G.harChOpen=ch;
trackChapterRead('har',ch);
if(G._harData){G.render();return;}
if(G._harLoading)return;
G._harLoading=true;
G.render();
try{
const r=await fetch('harrison_chapters.json');
G._harData=await r.json();
}catch(e){
console.error('Failed to load Harrison chapters',e);
G._harData={};
}
G._harLoading=false;
G.render();
}

// ===== FLASHCARDS =====


// Event delegation for Library tab — set up once on #ct container
export function initLibraryEvents(container) {
  container.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;

    if (action === 'submit-report') {
      G.S._reportType = 'wrong_answer';
      submitReport();
    }
    else if (action === 'goto-q') {
      const idx = parseInt(el.dataset.idx, 10);
      G.filt = 'all'; G.pool = [idx]; G.qi = 0;
      G.sel = null; G.ans = false;
      if (el.dataset.flip) G.flipRevealed = false;
      G.tab = 'quiz'; G.render();
    }
    else if (action === 'add-qs') {
      if (_pendingAiQs) addChapterQsToBank(_pendingAiQs);
    }
    else if (action === 'lib-section') {
      G.libSec = el.dataset.sec; G.render();
    }
    else if (action === 'close-chapter') {
      G.harChOpen = null; G.render();
    }
    else if (action === 'open-chapter') {
      openHarrisonChapter(parseInt(el.dataset.ch, 10));
    }
    else if (action === 'quiz-chapter') {
      const ch = G._harData && G._harData[String(G.harChOpen)];
      if (ch) quizMeOnChapter(G.harChOpen, ch.title);
    }
    else if (action === 'summarize-chapter') {
      const ch = G._harData && G._harData[String(G.harChOpen)];
      if (ch) aiSummarizeChapter(G.harChOpen, ch.title);
    }
    else if (action === 'drill-topic') {
      const ti = parseInt(el.dataset.ti, 10);
      G.tab = 'quiz'; G.filt = 'topic'; G.topicFilt = ti;
      buildPool(); G.render();
    }
    else if (action === 'filter-year') {
      G.tab = 'quiz'; G.filt = el.dataset.yr;
      buildPool(); G.render();
    }
  });
  container.addEventListener('input', (e) => {
    if (e.target.dataset.action === 'nel-search') {
      G.nelSearch = e.target.value;
      // Debounced re-render: avoid jank while typing on mobile
      clearTimeout(G._nelSearchTimer);
      G._nelSearchTimer = setTimeout(() => {
        const prev = document.activeElement;
        G.render();
        // Restore focus + caret to the search input after re-render
        if (prev && prev.dataset && prev.dataset.action === 'nel-search') {
          const next = document.querySelector('[data-action="nel-search"]');
          if (next) { next.focus(); next.setSelectionRange(next.value.length, next.value.length); }
        }
      }, 120);
    }
  });
}
