// tests/studyPlanAlgorithm.test.js
// Cross-language fixture for the JS port of generate_study_plan.py.
//
// The Python original (auto-audit/scripts/generate_study_plan.py) drives the
// reference plans for all three apps. The JS port here MUST produce
// byte-identical output for the Mishpacha slice — same hour allocation, same
// greedy week-fill, same week_used totals — or any drift between the two
// implementations would silently desync plans across devices.
//
// Inputs frozen for the fixture:
//   slice              = syllabus_data.json["Mishpacha"]   (27 topics)
//   total_topic_hours  = 89.6                              (= 16 weeks * 8 hpw * 0.7)
//   hours_per_week     = 8
//   weeks              = 16
//
// Reference outputs were captured from the live Python algorithm on
// 2026-04-27. Re-derive with:
//   python auto-audit/scripts/generate_study_plan.py --app mishpacha
//          --exam-date <today + 19w> --hours-per-week 8 --ramp-weeks 3

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { allocateHours, schedule, render } from '../src/features/study_plan/algorithm.js';

const rootDir = resolve(import.meta.dirname, '..');
const SYLLABUS_PATH = resolve(rootDir, 'src/features/study_plan/syllabus_data.json');
const SYLLABUS = JSON.parse(readFileSync(SYLLABUS_PATH, 'utf-8'));
const MISHPACHA_TOPICS = SYLLABUS.Mishpacha.topics;

describe('study_plan algorithm — JS↔Python cross-language fixture (Mishpacha)', () => {
  test('allocateHours: top-5 topics by hours match Python reference', () => {
    const allocated = allocateHours(MISHPACHA_TOPICS, 89.6);
    const top5 = [...allocated].sort((a, b) => b.hours - a.hours).slice(0, 5);
    expect(top5.map((t) => ({ id: t.id, freq: t.frequency_pct, hours: t.hours }))).toEqual([
      { id: 24, freq: 10.8, hours: 6.0 },
      { id:  9, freq:  9.4, hours: 6.0 },
      { id: 26, freq:  7.1, hours: 6.0 },
      { id: 14, freq:  6.4, hours: 5.7 },
      { id: 13, freq:  4.7, hours: 4.2 },
    ]);
  });

  test('allocateHours: every topic clamped to [0.5, 6.0] and rounded to 1 decimal', () => {
    const allocated = allocateHours(MISHPACHA_TOPICS, 89.6);
    expect(allocated.length).toBe(MISHPACHA_TOPICS.length);
    for (const t of allocated) {
      expect(t.hours).toBeGreaterThanOrEqual(0.5);
      expect(t.hours).toBeLessThanOrEqual(6.0);
      // Rounded to 1dp: hours * 10 must be an integer.
      expect(Math.abs(t.hours * 10 - Math.round(t.hours * 10))).toBeLessThan(1e-9);
    }
  });

  test('schedule: week_used per cell matches Python (±0.05)', () => {
    const allocated = allocateHours(MISHPACHA_TOPICS, 89.6);
    const { used } = schedule(allocated, 8, 16);
    const expected = [6.0, 6.0, 6.0, 5.7, 6.1, 6.1, 6.0, 6.1, 5.8, 5.7, 6.0, 5.3, 5.9, 5.1, 1.3, 0.0];
    expect(used.length).toBe(expected.length);
    for (let i = 0; i < expected.length; i++) {
      expect(Math.abs(used[i] - expected[i])).toBeLessThan(0.05);
    }
  });

  test('schedule: every topic placed exactly once across all weeks', () => {
    const allocated = allocateHours(MISHPACHA_TOPICS, 89.6);
    const { weeks } = schedule(allocated, 8, 16);
    const placedIds = weeks.flat().map((t) => t.id).sort((a, b) => a - b);
    const expectedIds = [...MISHPACHA_TOPICS].map((t) => t.id).sort((a, b) => a - b);
    expect(placedIds).toEqual(expectedIds);
  });

  test('schedule: weekly budget cap enforced (≤ hpw*0.7 + 0.5 fallback slack)', () => {
    const allocated = allocateHours(MISHPACHA_TOPICS, 89.6);
    const { used } = schedule(allocated, 8, 16);
    const cap = 8 * 0.7 + 0.5; // 6.1 — matches Python's `weekly_budget + 0.5`
    for (const u of used) expect(u).toBeLessThanOrEqual(cap + 1e-9);
  });
});

describe('study_plan algorithm — render() shape', () => {
  // render() is the JS-only display helper (not in the Python original):
  // produces the structured object the Settings UI consumes. Snapshot the
  // top-level shape so refactors in the renderer stay in sync with the UI.
  test('render() produces weeks + ramp_weeks + summary with expected fields', () => {
    const allocated = allocateHours(MISHPACHA_TOPICS, 89.6);
    const { weeks, used } = schedule(allocated, 8, 16);
    const startISO = '2026-05-04'; // Monday
    const examISO  = '2026-09-21'; // 16 topic + 3 ramp = 19 weeks later
    const display = render({
      startDateISO: startISO,
      examDateISO:  examISO,
      hoursPerWeek: 8,
      rampWeeks:    3,
      weeks,
      used,
      dailyQTarget: 25,
    });

    expect(display).toHaveProperty('weeks');
    expect(display).toHaveProperty('ramp_weeks');
    expect(display).toHaveProperty('summary');
    expect(display.weeks.length).toBe(16);
    expect(display.ramp_weeks.length).toBe(3);
    expect(display.summary).toMatchObject({
      exam_date: examISO,
      total_weeks: 19,
      daily_q_target: 25,
    });

    const w0 = display.weeks[0];
    expect(w0).toMatchObject({ idx: 1, start_date: '2026-05-04', end_date: '2026-05-10' });
    expect(Math.abs(w0.used_hours - 6.0)).toBeLessThan(0.05);
    expect(w0.topics.length).toBeGreaterThan(0);
    for (const t of w0.topics) {
      expect(t).toHaveProperty('id');
      expect(t).toHaveProperty('en');
      expect(t).toHaveProperty('he');
      expect(t).toHaveProperty('hours');
      expect(t).toHaveProperty('frequency_pct');
    }

    const r0 = display.ramp_weeks[0];
    expect(r0).toMatchObject({ idx: 1, mock_label: 'Mock exam #1' });
    expect(typeof r0.advice).toBe('string');
    expect(r0.start_date).toBe('2026-08-24'); // start + 16 weeks = 2026-08-24
    expect(r0.end_date).toBe('2026-08-30');
  });
});
