#!/usr/bin/env node
// B — Syllabus vs Q coverage audit (v1.4.3)
// Compare per-topic actual Q count (base + seed) vs IMA_WEIGHTS target.
import fs from 'node:fs';

const base = JSON.parse(fs.readFileSync('data/questions.json', 'utf8'));
const seed = JSON.parse(fs.readFileSync('data/ai_hard_seed.json', 'utf8'));
const all = [...base, ...seed];

// From src/core/constants.js
const TOPICS = [
  'Adult Cardiology — IHD & Arrhythmia',      // 0
  'Heart Failure & Valves',                    // 1
  'Hypertension & Lipids',                     // 2
  'Pulmonology (Asthma, COPD, PE)',            // 3
  'Gastroenterology & Hepatology',             // 4
  'Nephrology, UTI & Urology',                 // 5
  'Endocrinology — Diabetes',                  // 6
  'Endocrinology — Thyroid & Other',           // 7
  'Hematology & Coagulation',                  // 8
  'Rheumatology & Musculoskeletal',            // 9
  'Neurology (Stroke, Headache, Dementia)',    // 10
  'Dermatology',                               // 11
  'Allergy & Immunology',                      // 12
  'Infectious Disease & Vaccines (Adult)',     // 13
  "Women's Health & Gynecology",               // 14
  'Pregnancy, Perinatal & Postpartum',         // 15
  "Men's Health",                              // 16
  'Geriatrics (Falls, Cognition, Polypharmacy)', // 17
  'Mental Health — Mood, Anxiety, Psychosis',  // 18
  'Addictions & Lifestyle Behaviors',          // 19
  'Preventive Medicine & Health Promotion',    // 20
  'Pain, Palliative & End-of-Life',            // 21
  'Emergencies in the Clinic',                 // 22
  'Peds — Newborn & Development',              // 23
  'Peds — Acute & Infections',                 // 24
  'Peds — Adolescent & Mental Health',         // 25
  'EBM, Communication & Family Systems',       // 26
];

// IMA target weights (%) from constants.js
const IMA_WEIGHTS = [2,1,3,4,4,3,3,3,3,11,4,2,1,3,6,4,1,5,3,1,3,1,4,3,12,2,8];

// Count Qs per topic
const counts = new Array(27).fill(0);
all.forEach(q => {
  const ti = q.ti;
  if (typeof ti === 'number' && ti >= 0 && ti < 27) counts[ti]++;
});

const total = counts.reduce((a,b)=>a+b, 0);
console.log('Total classified Qs:', total, '/', all.length, '('+all.filter(q=>typeof q.ti==='number').length+' have ti)');
console.log('');
console.log('ti | Topic                                         | Actual | Target% | Target_n | Drift');
console.log('---|-----------------------------------------------|--------|---------|----------|-------');
let undercovered = [];
let overcovered = [];
counts.forEach((c, ti) => {
  const targetPct = IMA_WEIGHTS[ti];
  const targetN = Math.round(total * targetPct / 100);
  const drift = c - targetN;
  const driftPct = ((drift / targetN) * 100).toFixed(0);
  const warn = Math.abs(c - targetN) > targetN * 0.3 ? (c < targetN ? ' ⬇' : ' ⬆') : '';
  const name = TOPICS[ti].slice(0, 45).padEnd(45);
  console.log(
    String(ti).padStart(2) + ' | ' + name + ' | '
    + String(c).padStart(6) + ' | '
    + String(targetPct).padStart(6) + '% | '
    + String(targetN).padStart(8) + ' | '
    + (drift >= 0 ? '+' : '') + drift + ' ('+driftPct+'%)' + warn
  );
  if (c < targetN * 0.7) undercovered.push({ti, name:TOPICS[ti], actual:c, target:targetN, deficit:targetN-c});
  if (c > targetN * 1.3) overcovered.push({ti, name:TOPICS[ti], actual:c, target:targetN, excess:c-targetN});
});

console.log('');
console.log('=== Undercovered (>30% below target) ===');
undercovered.sort((a,b)=>b.deficit-a.deficit).forEach(x => {
  console.log('  ti'+x.ti+': '+x.name+' — '+x.actual+' vs '+x.target+' (need +'+x.deficit+')');
});
console.log('');
console.log('=== Overcovered (>30% above target) ===');
overcovered.sort((a,b)=>b.excess-a.excess).forEach(x => {
  console.log('  ti'+x.ti+': '+x.name+' — '+x.actual+' vs '+x.target+' (+'+x.excess+')');
});
