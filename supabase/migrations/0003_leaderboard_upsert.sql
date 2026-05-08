-- Mishpacha (Family Medicine) leaderboard — server-side upsert RPC.
--
-- Live-state finding 2026-05-08: the FM leaderboard had 0 rows ever, BUT
-- the table itself does exist in `public.mishpacha_leaderboard`. The
-- prior diagnoses (sb_publishable_* RLS, missing-table) were both wrong.
-- Real cause: `mishpacha_leaderboard.ts` is bigint, the client sends
-- new Date().toISOString() (text), and PostgREST silently rejects the
-- type-coerce mismatch. Every write returned non-ok and dropped on the
-- floor.
--
-- This migration adds a SECURITY DEFINER RPC that:
--   1. Accepts p_ts as text (ISO 8601), the existing wire format.
--   2. Casts it to bigint epoch milliseconds before storing in the
--      table's existing bigint column. Closes the silent-write bug.
--   3. Computes accuracy server-side as real (matches existing column type).
--   4. Bypasses RLS so future sb_publishable_* key migration is also safe.
--
-- Idempotent (CREATE OR REPLACE FUNCTION). Reversible:
--   DROP FUNCTION IF EXISTS public.mishpacha_leaderboard_upsert(text,int,int,int,int,text);

CREATE OR REPLACE FUNCTION public.mishpacha_leaderboard_upsert(
  p_uid       text,
  p_answered  int,
  p_correct   int,
  p_streak    int,
  p_readiness int,
  p_ts        text DEFAULT NULL
)
RETURNS public.mishpacha_leaderboard
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  result   public.mishpacha_leaderboard;
  v_ts_ms  bigint;
BEGIN
  IF p_uid IS NULL OR length(trim(p_uid)) = 0 THEN
    RAISE EXCEPTION 'p_uid required';
  END IF;
  IF p_answered IS NULL OR p_answered < 0 THEN
    RAISE EXCEPTION 'p_answered must be >= 0';
  END IF;
  IF p_correct IS NULL OR p_correct < 0 OR p_correct > p_answered THEN
    RAISE EXCEPTION 'p_correct must be in [0, p_answered]';
  END IF;

  -- Coerce text ISO -> bigint epoch ms (the table column type).
  -- If p_ts is null, use now().
  IF p_ts IS NULL OR length(trim(p_ts)) = 0 THEN
    v_ts_ms := (EXTRACT(EPOCH FROM now()) * 1000)::bigint;
  ELSE
    BEGIN
      v_ts_ms := (EXTRACT(EPOCH FROM p_ts::timestamptz) * 1000)::bigint;
    EXCEPTION WHEN OTHERS THEN
      v_ts_ms := (EXTRACT(EPOCH FROM now()) * 1000)::bigint;
    END;
  END IF;

  INSERT INTO public.mishpacha_leaderboard
    (uid, answered, correct, streak, readiness, accuracy, ts, updated_at)
  VALUES (
    p_uid,
    p_answered,
    p_correct,
    COALESCE(p_streak, 0),
    GREATEST(0, LEAST(100, COALESCE(p_readiness, 0))),
    CASE WHEN p_answered > 0
         THEN (p_correct::real / p_answered::real) * 100.0
         ELSE NULL::real END,    -- FM accuracy is regular (not generated) so we set it explicitly
    v_ts_ms,
    now()
  )
  ON CONFLICT (uid) DO UPDATE SET
    answered   = EXCLUDED.answered,
    correct    = EXCLUDED.correct,
    streak     = EXCLUDED.streak,
    readiness  = EXCLUDED.readiness,
    accuracy   = EXCLUDED.accuracy,
    ts         = EXCLUDED.ts,
    updated_at = now()
  RETURNING * INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE
  ON FUNCTION public.mishpacha_leaderboard_upsert(text, int, int, int, int, text)
  TO anon, authenticated;

COMMENT ON FUNCTION public.mishpacha_leaderboard_upsert IS
  'Idempotent leaderboard upsert. Accepts ts as text (ISO 8601), stores as bigint epoch ms. '
  'Computes accuracy server-side. SECURITY DEFINER bypasses RLS to survive '
  'sb_publishable_* key migration. Sibling: pnimit_leaderboard_upsert, shlav_leaderboard_upsert.';
