#!/usr/bin/env node
// gen_ai_hard.mjs — generate hard-level FM board MCQs from Goroll chapters + AFP articles.
// Intentionally left off the build path; run manually to refresh data/ai_hard_seed.json.
//
// Usage:
//   ANTHROPIC_API_KEY=sk-... node scripts/gen_ai_hard.mjs --goroll 10 --afp 10
//   (outputs to data/ai_hard_seed.generated.json — you review + merge into ai_hard_seed.json)
//
// Why not auto-merge into ai_hard_seed.json: LLM output needs a manual review pass
// (answer-key verification, Hebrew fluency, topic-index assignment). Generate → review → merge.
//
// Dependencies: only Node's built-in fetch (18+). No npm install required.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => {
    if (cur.startsWith('--')) acc.push([cur.slice(2), arr[i + 1]]);
    return acc;
  }, [])
);
const N_GOROLL = parseInt(args.goroll || '0', 10);
const N_AFP    = parseInt(args.afp || '0', 10);
const OUT      = args.out || join(ROOT, 'data/ai_hard_seed.generated.json');

if (!N_GOROLL && !N_AFP) {
  console.error('Usage: node scripts/gen_ai_hard.mjs --goroll N --afp M [--out path.json]');
  process.exit(1);
}

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error('ANTHROPIC_API_KEY env var not set.');
  process.exit(1);
}
const MODEL = process.env.AI_MODEL || 'claude-sonnet-4-6';

const SYSTEM = `You are an Israeli family medicine board examiner writing very-hard-level MCQs for the P0062-2025 שלב א׳ רפואת המשפחה exam.

Constraints:
- Question stem in clinical vignette form (patient age, sex, relevant history).
- 4 options, exactly one correct.
- Difficulty = hard (not trivial recall — requires applying a threshold, synthesizing two pieces of data, or distinguishing near-miss answers).
- Each Q must cite a specific number, threshold, criterion, drug, or guideline.
- Explanation in HEBREW, 2–4 sentences, cite the source chapter/guideline.

Output ONLY a JSON array (no prose, no markdown fence):
[{"q":"Hebrew vignette...","o":["א. ...","ב. ...","ג. ...","ד. ..."],"c":0,"c_accept":[0],"t":"AI-Hard-G","st":"short topic","ti":<0-26>,"e":"Hebrew explanation + source"}]

Topic indices (ti): 0 IHD, 1 HF, 2 HTN/lipids, 3 Pulm, 4 GI, 5 Renal/UTI, 6 DM, 7 Thyroid, 8 Heme, 9 MSK, 10 Neuro, 11 Derm, 12 Allergy, 13 ID, 14 Women, 15 Preg, 16 Men, 17 Geri, 18 Mental, 19 Addiction, 20 Prev, 21 Pain, 22 Emerg, 23 Peds-Newborn, 24 Peds-Acute, 25 Peds-Adolesc, 26 EBM.
`;

async function callAnthropic(userPrompt, maxTokens = 4000) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system: SYSTEM,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${body}`);
  }
  const json = await res.json();
  return json.content[0].text;
}

function parseQs(text, expectedTag) {
  const cleaned = text.replace(/```json|```/g, '').trim();
  const arr = JSON.parse(cleaned);
  if (!Array.isArray(arr)) throw new Error('LLM response was not an array');
  return arr.map(q => {
    // Defensive: force the tag from the caller, ignore whatever the LLM wrote.
    q.t = expectedTag;
    if (!Array.isArray(q.c_accept)) q.c_accept = [q.c];
    return q;
  });
}

// --- Goroll chapters ---
async function genFromGoroll(n) {
  const goroll = JSON.parse(readFileSync(join(ROOT, 'goroll_chapters.json'), 'utf8'));
  const picks = shuffle(goroll).slice(0, Math.min(n, goroll.length));
  const out = [];
  for (const ch of picks) {
    console.log(`→ Goroll Ch ${ch.num}: ${ch.title}`);
    const prompt = `Generate 1 hard MCQ from Goroll 8e Chapter ${ch.num}: ${ch.title}. Focus on a specific threshold or decision rule that a שלב א׳ examiner would test. Output only the JSON array.`;
    try {
      const text = await callAnthropic(prompt, 1500);
      const qs = parseQs(text, 'AI-Hard-G');
      out.push(...qs);
    } catch (e) {
      console.error(`  ✗ ${e.message}`);
    }
  }
  return out;
}

// --- AFP/הר"י papers ---
async function genFromAfp(n) {
  const idx = JSON.parse(readFileSync(join(ROOT, 'data/afp_hari_index.json'), 'utf8'));
  const usable = idx.papers.filter(p => p.kind === 'AFP' && p.sort && p.sort.length > 200);
  const picks = shuffle(usable).slice(0, Math.min(n, usable.length));
  const out = [];
  for (const p of picks) {
    console.log(`→ AFP ${p.year} — ${p.title.slice(0, 60)}`);
    const ctx = [p.title, p.citation, p.abstract, p.sort].filter(Boolean).join('\n\n').slice(0, 4500);
    const prompt = `Generate 1 hard MCQ based on this AFP article. Lean on its SORT-A/B recommendation(s).

Title: ${p.title}
Specialty: ${p.specialty}
Citation: ${p.citation || 'n/a'}
---
${ctx}
---
Output only the JSON array with one question tagged "AI-Hard-AFP".`;
    try {
      const text = await callAnthropic(prompt, 1500);
      const qs = parseQs(text, 'AI-Hard-AFP');
      out.push(...qs);
    } catch (e) {
      console.error(`  ✗ ${e.message}`);
    }
  }
  return out;
}

function shuffle(a) {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// --- main ---
const generated = [];
if (N_GOROLL > 0) generated.push(...(await genFromGoroll(N_GOROLL)));
if (N_AFP > 0) generated.push(...(await genFromAfp(N_AFP)));

// Merge with existing generated file if present, so repeated runs accumulate rather than overwrite.
let existing = [];
if (existsSync(OUT)) {
  existing = JSON.parse(readFileSync(OUT, 'utf8'));
  console.log(`→ Merging with ${existing.length} existing generated Qs in ${OUT}`);
}

const merged = [...existing, ...generated];
writeFileSync(OUT, JSON.stringify(merged, null, 2));
console.log(`\n✔ Wrote ${merged.length} Qs (${generated.length} new) to ${OUT}`);
console.log('Review, then manually merge into data/ai_hard_seed.json and rebuild.');
