-- Mishpacha Mega v1.9.0 — Study Plan storage
--
-- Per-user, per-app study plans (one row per (username, app)). Used by the
-- in-app Study Plan generator: client computes a frequency-weighted plan
-- from data/syllabus_data.json and persists the result via
-- study_plan_upsert(); other devices retrieve it via study_plan_get().
--
-- Security model (mirrors app_users / auth_*):
--   - RLS ENABLED, ZERO POLICIES → direct REST access is denied for both
--     anon and authenticated keys. The two SECURITY DEFINER RPCs below are
--     the ONLY way to read/write the table.
--   - SECURITY DEFINER + SET search_path = pg_catalog, public is required
--     so the function runs as the table owner regardless of caller and
--     cannot be tricked by a hostile search_path.
--   - upsert verifies the username actually exists in public.app_users;
--     a stale/forged username silently fails with {ok:false,error:'no_such_user'}.
--
-- Run once in the Supabase SQL editor (project krmlzwwelqvlfslwltol).
-- After this migration is applied the FE feature in src/features/study_plan/
-- starts working immediately for both logged-in users (writes persist) and
-- guest users (RPCs reject unknown usernames; the FE falls back to a
-- "log in to save your plan" hint).

CREATE TABLE IF NOT EXISTS public.study_plans (
  username        text        NOT NULL REFERENCES public.app_users(username) ON DELETE CASCADE,
  app             text        NOT NULL CHECK (app IN ('geri','pnimit','mishpacha')),
  exam_date       date        NOT NULL,
  hours_per_week  numeric     NOT NULL DEFAULT 8 CHECK (hours_per_week BETWEEN 1 AND 40),
  ramp_weeks      int         NOT NULL DEFAULT 3 CHECK (ramp_weeks BETWEEN 1 AND 6),
  plan_json       jsonb,
  generated_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (username, app)
);

ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
-- Intentionally NO POLICIES — RPCs are the only entry point.

-- ────────────────────────────────────────────────────────────────────
-- study_plan_upsert(p_username, p_app, p_exam_date, p_hours_per_week, p_ramp_weeks, p_plan_json)
--   Returns: jsonb { ok: bool, error?: text }
--   Verifies p_username exists in app_users, then INSERT … ON CONFLICT.
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.study_plan_upsert(
  p_username       text,
  p_app            text,
  p_exam_date      date,
  p_hours_per_week numeric,
  p_ramp_weeks     int,
  p_plan_json      jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_exists boolean;
BEGIN
  IF p_username IS NULL OR length(p_username) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_username');
  END IF;
  IF p_app NOT IN ('geri','pnimit','mishpacha') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_app');
  END IF;
  IF p_exam_date IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_exam_date');
  END IF;
  IF p_hours_per_week IS NULL OR p_hours_per_week < 1 OR p_hours_per_week > 40 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_hours_per_week');
  END IF;
  IF p_ramp_weeks IS NULL OR p_ramp_weeks < 1 OR p_ramp_weeks > 6 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_ramp_weeks');
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.app_users u WHERE u.username = p_username) INTO v_exists;
  IF NOT v_exists THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_such_user');
  END IF;

  INSERT INTO public.study_plans (
    username, app, exam_date, hours_per_week, ramp_weeks, plan_json, generated_at
  ) VALUES (
    p_username, p_app, p_exam_date, p_hours_per_week, p_ramp_weeks, p_plan_json, now()
  )
  ON CONFLICT (username, app) DO UPDATE SET
    exam_date      = EXCLUDED.exam_date,
    hours_per_week = EXCLUDED.hours_per_week,
    ramp_weeks     = EXCLUDED.ramp_weeks,
    plan_json      = EXCLUDED.plan_json,
    generated_at   = EXCLUDED.generated_at;

  RETURN jsonb_build_object('ok', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'error', 'db_error', 'message', SQLERRM);
END;
$$;

-- ────────────────────────────────────────────────────────────────────
-- study_plan_get(p_username, p_app)
--   Returns: jsonb { ok: bool, plan: null | { exam_date, hours_per_week,
--                                              ramp_weeks, plan_json,
--                                              generated_at } }
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.study_plan_get(
  p_username text,
  p_app      text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_row public.study_plans;
BEGIN
  IF p_username IS NULL OR length(p_username) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_username');
  END IF;
  IF p_app NOT IN ('geri','pnimit','mishpacha') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_app');
  END IF;

  SELECT * INTO v_row FROM public.study_plans
   WHERE username = p_username AND app = p_app;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', true, 'plan', NULL);
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'plan', jsonb_build_object(
      'exam_date',      v_row.exam_date,
      'hours_per_week', v_row.hours_per_week,
      'ramp_weeks',     v_row.ramp_weeks,
      'plan_json',      v_row.plan_json,
      'generated_at',   v_row.generated_at
    )
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'error', 'db_error', 'message', SQLERRM);
END;
$$;

-- Make the RPCs callable with both the anon and authenticated keys.
-- (Direct table access remains denied — RLS is enabled with no policies.)
GRANT EXECUTE ON FUNCTION public.study_plan_upsert(text, text, date, numeric, int, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.study_plan_get(text, text)                                 TO anon, authenticated;
