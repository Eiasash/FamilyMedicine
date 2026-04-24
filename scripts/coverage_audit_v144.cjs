// Coverage audit — FM v1.4.4 (post Lerner integration)
// Writes docs/coverage_audit_v144.md

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const TOPICS = [
  'IHD & Arrhythmia','HF & Valves','HTN & Lipids','Pulm (Asthma/COPD/PE)',
  'GI & Hepatology','Nephro/UTI/Uro','Endo — DM','Endo — Thyroid',
  'Heme & Coag','Rheum/MSK','Neuro','Derm','Allergy/Immuno','ID & Vaccines',
  'Women\'s Health','Pregnancy & Perinatal','Men\'s Health','Geriatrics',
  'Mental Health','Addictions/Lifestyle','Preventive Med','Pain/Palliative',
  'Clinic Emergencies','Peds — Newborn/Dev','Peds — Acute/Infect','Peds — Adolescent',
  'EBM/Communication'
];
const IMA = [2,1,3,4,4,3,3,3,3,11,4,2,1,3,6,4,1,5,3,1,3,1,4,3,12,2,8];

const T2S = {
  0:['קרדיולוגיה'],
  1:['קרדיולוגיה'],
  2:['קרדיולוגיה','נפרולוגיה, אלקטרוליטים ולחץ-דם'],
  3:['ריאות'],
  4:['גסטרואנטרולוגיה'],
  5:['נפרולוגיה, אלקטרוליטים ולחץ-דם','אורולוגיה'],
  6:['אנדוקרינולוגיה'],
  7:['אנדוקרינולוגיה'],
  8:['המטולוגיה'],
  9:['אורתופדיה','ראומטולוגיה'],
  10:['נוירולוגיה'],
  11:['עור'],
  12:['סוגיות ותסמינים כלליים','תרופות, פרמקולוגיה וטוקסיקולוגיה'],
  13:['מחלות זיהומיות'],
  14:['רפואת נשים'],
  15:['רפואת נשים'],
  16:['אורולוגיה'],
  17:['סוגיות ותסמינים כלליים'],
  18:['פסיכיאטריה'],
  19:['פסיכיאטריה'],
  20:['קידום בריאות ורפואה מונעת'],
  21:['כאב'],
  22:['סוגיות ותסמינים כלליים'],
  23:['רפואת ילדים'],
  24:['רפואת ילדים'],
  25:['רפואת ילדים','פסיכיאטריה'],
  26:['קידום בריאות ורפואה מונעת'],
};

// Load data
const ler = JSON.parse(fs.readFileSync(path.join(ROOT,'lerner_chapters.json'),'utf8'));
const gor = JSON.parse(fs.readFileSync(path.join(ROOT,'goroll_chapters.json'),'utf8'));
const nel = JSON.parse(fs.readFileSync(path.join(ROOT,'nelson_chapters.json'),'utf8'));
const afp = JSON.parse(fs.readFileSync(path.join(ROOT,'data','afp_hari_index.json'),'utf8'));
const q   = JSON.parse(fs.readFileSync(path.join(ROOT,'data','questions.json'),'utf8'));

const lerByTi = {}; let lerUn=0;
ler.chapters.forEach(c => { if (c.ti != null) lerByTi[c.ti]=(lerByTi[c.ti]||0)+1; else lerUn++; });

const gorLen = Array.isArray(gor) ? gor.length : Object.keys(gor).length;
const nelWithNotes = nel.filter(c => c.notes_he && c.notes_he.length>0).length;

const afpBySpec = {};
afp.papers.forEach(p => { afpBySpec[p.specialty]=(afpBySpec[p.specialty]||0)+1; });
const afpByTi = {};
for (let i=0;i<27;i++) {
  let n=0;
  (T2S[i]||[]).forEach(s => { n += (afpBySpec[s]||0); });
  afpByTi[i] = n;
}

const qByTi = {};
q.forEach(x => { if (x.ti != null) qByTi[x.ti]=(qByTi[x.ti]||0)+1; });

// Nelson only meaningful for peds topics (23/24/25) — chapter-level notes, no topic tagging
const nelCount = ti => (ti===23||ti===24||ti===25) ? nelWithNotes : 0;

const rows = [];
for (let i=0;i<27;i++) {
  const w=IMA[i], qs=qByTi[i]||0, afpC=afpByTi[i]||0, lerC=lerByTi[i]||0, nelC=nelCount(i);
  const nonQ = afpC + lerC + nelC;
  const ratio = nonQ / w;
  let rating;
  if (nonQ === 0) rating = '🚨 ZERO';
  else if (ratio < 2) rating = '⚠️ thin';
  else if (ratio < 5) rating = 'ok';
  else rating = '✅ rich';
  rows.push({ti:i,w,lbl:TOPICS[i],qs,nel:nelC,afp:afpC,ler:lerC,nonQ,ratio,rating});
}

const ranked = rows.slice().sort((a,b) => a.ratio - b.ratio);

// Console summary
console.log('=== FM Shlav A Coverage Audit v1.4.4 ===');
console.log('Questions:', q.length);
console.log('Goroll 8e chapters:', gorLen, '(whole book; not ti-tagged)');
console.log('Nelson 22e chapters w/ notes:', nelWithNotes, '/', nel.length);
console.log('AFP/hari papers in window:', afp.papers.length);
console.log('Lerner 2025 sections:', ler.chapters.length, '(unmapped:', lerUn+')');
console.log();
console.log('ti | wt | topic                         | Qs  | Nel | AFP | Ler | nonQ/wt | rating');
console.log('---+----+-------------------------------+-----+-----+-----+-----+---------+-------');
rows.forEach(r => {
  console.log(
    String(r.ti).padStart(2) + ' | ' +
    String(r.w).padStart(2) + ' | ' +
    r.lbl.padEnd(29) + ' | ' +
    String(r.qs).padStart(3) + ' | ' +
    String(r.nel).padStart(3) + ' | ' +
    String(r.afp).padStart(3) + ' | ' +
    String(r.ler).padStart(3) + ' | ' +
    r.ratio.toFixed(2).padStart(7) + ' | ' +
    r.rating
  );
});

console.log();
console.log('--- Top 10 thin-vs-weight (fix first) ---');
ranked.slice(0,10).forEach((r,idx) => {
  console.log((idx+1)+'. ti '+r.ti+' w='+r.w+' '+r.lbl+' → nonQ='+r.nonQ+' ratio='+r.ratio.toFixed(2)+' '+r.rating);
});

// Write markdown
const md = [];
md.push('# FM Shlav A — Source Coverage Audit v1.4.4');
md.push('');
md.push('_Generated 2026-04-23, post-Lerner-2025 integration._');
md.push('');
md.push('## Totals');
md.push('');
md.push('- Questions: **' + q.length + '**');
md.push('- Goroll 8e chapters: **' + gorLen + '** (primary text; not topic-tagged at index level)');
md.push('- Nelson 22e chapters with Hebrew notes: **' + nelWithNotes + '** / ' + nel.length + ' required');
md.push('- AFP / הר"י papers in-window: **' + afp.papers.length + '** (window ' + afp.window + ', exam ' + afp.exam + ')');
md.push('- Lerner 2025 sections: **' + ler.chapters.length + '** (' + lerUn + ' unmapped to ti)');
md.push('');
md.push('## Per-topic coverage');
md.push('');
md.push('"nonQ/wt" = (Nelson notes + AFP/הר"י papers + Lerner sections) ÷ IMA weight. Questions are excluded so this measures reference depth, not drill volume.');
md.push('');
md.push('| ti | wt | Topic | Qs | Nelson | AFP/הר"י | Lerner | nonQ/wt | Rating |');
md.push('|---:|---:|-------|---:|-------:|---------:|-------:|--------:|--------|');
rows.forEach(r => {
  md.push('| ' + r.ti + ' | ' + r.w + ' | ' + r.lbl + ' | ' + r.qs + ' | ' + r.nel + ' | ' + r.afp + ' | ' + r.ler + ' | ' + r.ratio.toFixed(2) + ' | ' + r.rating + ' |');
});
md.push('');
md.push('## Priority queue — sourcing');
md.push('');
md.push('Top 10 topics by thin-vs-weight (ratio ascending):');
md.push('');
md.push('| # | ti | wt | Topic | nonQ | ratio | notes |');
md.push('|---:|---:|---:|-------|---:|---:|-------|');
ranked.slice(0,10).forEach((r,idx) => {
  let note = '';
  if (r.afp === 0) note += 'no AFP/הר"י; ';
  if (r.ler === 0) note += 'no Lerner; ';
  if (r.nel === 0 && (r.ti===23||r.ti===24||r.ti===25)) note += 'no Nelson notes; ';
  md.push('| ' + (idx+1) + ' | ' + r.ti + ' | ' + r.w + ' | ' + r.lbl + ' | ' + r.nonQ + ' | ' + r.ratio.toFixed(2) + ' | ' + (note || '—') + ' |');
});
md.push('');
md.push('## Interpretation');
md.push('');
md.push('Ratings (nonQ ÷ weight):');
md.push('');
md.push('- **🚨 ZERO** — no non-Q reference anywhere. Board-exam liability. Must source.');
md.push('- **⚠️ thin** (<2) — leaning on questions alone. Add AFP/הר"י or Lerner sections.');
md.push('- **ok** (2-5) — adequate.');
md.push('- **✅ rich** (≥5) — well-covered; no action.');
md.push('');
md.push('Nelson notes count only on Peds topics (23/24/25) because notes_he is peds-chapter-specific. Non-peds topics cannot benefit from Nelson.');
md.push('');
md.push('## Lerner unmapped sections');
md.push('');
md.push('' + lerUn + ' Lerner sections have no ti tag. These are either mapping-rule gaps or genuinely cross-cutting content (intro, appendices, EBM frameworks). Review candidate mappings in a follow-up pass.');
md.push('');

fs.writeFileSync(path.join(ROOT,'docs','coverage_audit_v144.md'), md.join('\n'));
console.log();
console.log('Wrote docs/coverage_audit_v144.md');
