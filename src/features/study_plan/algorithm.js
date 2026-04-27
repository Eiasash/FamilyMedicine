// JS port of auto-audit/scripts/generate_study_plan.py — Mishpacha slice.
//
// `allocateHours` and `schedule` are ported VERBATIM from the Python original.
// Any drift here desyncs the in-app plan from the reference implementation,
// so the cross-language fixture in tests/studyPlanAlgorithm.test.js pins the
// two together. If you change either function, the Python copy must be
// updated in lockstep.
//
// `render()` is JS-only — it builds the structured display object the
// Settings UI consumes. The Python version emits Markdown, which we don't
// want in-app.

// ─────────────────────────────────────────────────────────────
// allocate_hours — VERBATIM from generate_study_plan.py
// ─────────────────────────────────────────────────────────────
/**
 * Assign hours to each topic by frequency_pct, with a floor of 0.5h and a
 * ceiling of 6h per topic to avoid degenerate distributions when one topic
 * dominates the empirical frequency.
 *
 * @param {Array<Object>} topics  — each {id,en,he,keywords,n_questions,frequency_pct,...}
 * @param {number}        totalHours — typically `topic_weeks * hours_per_week * 0.7`
 * @returns {Array<Object>} new array of `{...topic, hours}` (1-decimal-rounded)
 */
export function allocateHours(topics, totalHours) {
  const totalFreq = topics.reduce((s, t) => s + t.frequency_pct, 0) || 100.0;
  return topics.map((t) => {
    const share = t.frequency_pct / totalFreq;
    // round(max(0.5, min(6.0, share*total_hours)), 1)
    const raw = Math.max(0.5, Math.min(6.0, share * totalHours));
    const hours = Math.round(raw * 10) / 10;
    return { ...t, hours };
  });
}

// ─────────────────────────────────────────────────────────────
// schedule — VERBATIM from generate_study_plan.py
// ─────────────────────────────────────────────────────────────
/**
 * Greedy weekly allocation: high-frequency topics first, fill week up to
 * 0.7 * hours_per_week (rest reserved for Q-bank work). Falls back to the
 * least-loaded week if no week has capacity within `weekly_budget + 0.5`.
 *
 * The 0.7 multiplier is intentional — it carves out 30% of the weekly study
 * budget for spaced-repetition Q-bank reviews, which the plan does NOT
 * schedule explicitly (the user runs them daily via the existing FSRS
 * engine). DO NOT raise it without coordinating with the Q-bank workload.
 *
 * @param {Array<Object>} topics — output of allocateHours()
 * @param {number}        hoursPerWeek
 * @param {number}        weeks  — number of topic-study weeks (excludes ramp)
 * @returns {{ weeks: Array<Array<Object>>, used: number[] }}
 */
export function schedule(topics, hoursPerWeek, weeks) {
  const weeklyBudget = hoursPerWeek * 0.7;
  // sorted(topics, key=lambda t: -t['frequency_pct'])  → stable descending by frequency_pct
  const sortedTopics = [...topics].sort((a, b) => b.frequency_pct - a.frequency_pct);
  const weeksArr = Array.from({ length: weeks }, () => []);
  const used = new Array(weeks).fill(0);

  for (const t of sortedTopics) {
    let placed = false;
    for (let i = 0; i < weeks; i++) {
      // used[i] + t.hours <= weekly_budget + 0.5  → tolerate up to half-hour overshoot
      if (used[i] + t.hours <= weeklyBudget + 0.5 + 1e-9) {
        weeksArr[i].push(t);
        used[i] += t.hours;
        placed = true;
        break;
      }
    }
    if (!placed) {
      // i = min(range(weeks), key=lambda j: used[j])  → least-loaded week, ties → smallest idx
      let minIdx = 0;
      for (let j = 1; j < weeks; j++) if (used[j] < used[minIdx]) minIdx = j;
      weeksArr[minIdx].push(t);
      used[minIdx] += t.hours;
    }
  }

  // Round used[] to 1dp for display parity with Python's f"{used[i]:.1f}".
  // Internal float-add drift accumulates to ~1e-13; keep the raw sum for
  // the budget assertion and round only at the boundary.
  const usedRounded = used.map((u) => Math.round(u * 10) / 10);
  return { weeks: weeksArr, used: usedRounded };
}

// ─────────────────────────────────────────────────────────────
// render — JS-only structured display data for the Settings UI
// ─────────────────────────────────────────────────────────────
const RAMP_ADVICE = [
  // Mock #1
  'בחינת דמה ראשונה במצב מלא ומוקצב. סקירת כל טעות, סימון לחזרה (FSRS). חזרה חמה: 5 הנושאים החלשים ביותר במוק (בדרך כלל בעלי תדירות גבוהה שציון < 70%).',
  // Mock #2
  'בחינת דמה שנייה — סט שאלות חדש במצב מוקצב. השווה למוק #1: אילו נושאים השתפרו ואילו לא. תרגול ממוקד בנושאים בעלי תדירות גבוהה שציון < 70%.',
  // Mock #3
  'בחינת דמה שלישית — סימולציה מלאה בתנאי בחינה. חזרה קלה בלבד יום לפני הבחינה. 8 שעות שינה, ללא חומר חדש ב-48 השעות האחרונות.',
];

function _addDaysISO(iso, days) {
  // ISO date math without timezone surprises: build a UTC midnight, add days, format.
  const [y, m, d] = iso.split('-').map(Number);
  const ms = Date.UTC(y, m - 1, d) + days * 86400000;
  const dt = new Date(ms);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/**
 * Build the structured display object consumed by the Settings UI.
 *
 * @param {Object} args
 * @param {string} args.startDateISO  YYYY-MM-DD
 * @param {string} args.examDateISO   YYYY-MM-DD
 * @param {number} args.hoursPerWeek
 * @param {number} args.rampWeeks
 * @param {Array<Array<Object>>} args.weeks  — output of schedule().weeks
 * @param {number[]} args.used               — output of schedule().used
 * @param {number} [args.dailyQTarget=25]
 * @returns {{
 *   weeks: Array<{idx,start_date,end_date,topics,used_hours}>,
 *   ramp_weeks: Array<{idx,start_date,end_date,mock_label,advice}>,
 *   summary: {exam_date,total_weeks,daily_q_target,start_date,hours_per_week,ramp_weeks,topic_weeks}
 * }}
 */
export function render({
  startDateISO,
  examDateISO,
  hoursPerWeek,
  rampWeeks,
  weeks,
  used,
  dailyQTarget = 25,
}) {
  const topicWeeks = weeks.length;
  const totalWeeks = topicWeeks + rampWeeks;

  const weeksOut = weeks.map((wTopics, i) => {
    const startISO = _addDaysISO(startDateISO, i * 7);
    const endISO   = _addDaysISO(startISO, 6);
    return {
      idx: i + 1,
      start_date: startISO,
      end_date:   endISO,
      topics: wTopics.map((t) => ({
        id:             t.id,
        en:             t.en,
        he:             t.he,
        hours:          t.hours,
        frequency_pct:  t.frequency_pct,
        keywords:       Array.isArray(t.keywords) ? t.keywords.slice(0, 8) : [],
      })),
      used_hours: used[i],
    };
  });

  const rampOut = [];
  for (let j = 0; j < rampWeeks; j++) {
    const startISO = _addDaysISO(startDateISO, (topicWeeks + j) * 7);
    const endISO   = _addDaysISO(startISO, 6);
    rampOut.push({
      idx: j + 1,
      start_date: startISO,
      end_date:   endISO,
      mock_label: `Mock exam #${j + 1}`,
      advice:     RAMP_ADVICE[Math.min(j, RAMP_ADVICE.length - 1)],
    });
  }

  return {
    weeks: weeksOut,
    ramp_weeks: rampOut,
    summary: {
      start_date:     startDateISO,
      exam_date:      examDateISO,
      total_weeks:    totalWeeks,
      topic_weeks:    topicWeeks,
      ramp_weeks:     rampWeeks,
      hours_per_week: hoursPerWeek,
      daily_q_target: dailyQTarget,
    },
  };
}

// ─────────────────────────────────────────────────────────────
// Convenience wrapper: takes the raw Mishpacha topic slice + user inputs
// and returns the full display object. Used by the Settings UI.
// ─────────────────────────────────────────────────────────────
/**
 * @param {Object} args
 * @param {Array<Object>} args.topics       — raw topics from syllabus_data.json["Mishpacha"].topics
 * @param {string} args.startDateISO
 * @param {string} args.examDateISO
 * @param {number} args.hoursPerWeek
 * @param {number} args.rampWeeks
 * @param {number} [args.dailyQTarget=25]
 * @returns {{display: ReturnType<typeof render>, planJson: Object}}
 */
export function buildPlan({
  topics,
  startDateISO,
  examDateISO,
  hoursPerWeek,
  rampWeeks,
  dailyQTarget = 25,
}) {
  const start = new Date(startDateISO + 'T00:00:00Z').getTime();
  const exam  = new Date(examDateISO  + 'T00:00:00Z').getTime();
  if (!(exam > start)) throw new Error('exam_date_must_be_after_start_date');
  const totalWeeks = Math.floor((exam - start) / (86400000 * 7));
  if (totalWeeks < rampWeeks + 4) {
    throw new Error('not_enough_weeks');
  }
  const topicWeeks = totalWeeks - rampWeeks;
  const totalTopicHours = topicWeeks * hoursPerWeek * 0.7;

  const allocated = allocateHours(topics, totalTopicHours);
  const { weeks, used } = schedule(allocated, hoursPerWeek, topicWeeks);
  const display = render({
    startDateISO,
    examDateISO,
    hoursPerWeek,
    rampWeeks,
    weeks,
    used,
    dailyQTarget,
  });

  // planJson is what we persist server-side via study_plan_upsert(). Keeping
  // both the structured display + the per-topic allocation lets a future
  // device rebuild the UI without re-running the algorithm.
  const planJson = {
    version: 1,
    generated_at: new Date().toISOString(),
    inputs: { startDateISO, examDateISO, hoursPerWeek, rampWeeks, dailyQTarget },
    allocated,
    display,
  };
  return { display, planJson };
}
