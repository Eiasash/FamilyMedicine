-- 0004_mishpacha_feedback_sibling_parity.sql
-- Fix: the Eiasash-auto-audit bot SELECTs (message, diagnostics, app_version, context)
-- from mishpacha_feedback, but this table was never migrated to the sibling schema
-- (shlav_feedback / pnimit_feedback have those columns; mishpacha still had only the
-- legacy text/version/uid/ts columns the FM app writes). PostgREST returned 400
-- "Could not find the 'message' column" on every bot poll (~every 30 min).
--
-- Additive fix, no app redeploy required: add the four parity columns, backfill from
-- the legacy columns, and keep them synced on future inserts via a trigger (the FM app
-- deliberately writes legacy text/version -- see src/core/changelog.js "Feedback
-- submission 400 fix"). Applied to the shared project krmlzwwelqvlfslwltol on 2026-07-13.

ALTER TABLE public.mishpacha_feedback ADD COLUMN IF NOT EXISTS message text;
ALTER TABLE public.mishpacha_feedback ADD COLUMN IF NOT EXISTS diagnostics text;
ALTER TABLE public.mishpacha_feedback ADD COLUMN IF NOT EXISTS app_version text;
ALTER TABLE public.mishpacha_feedback ADD COLUMN IF NOT EXISTS context text;

UPDATE public.mishpacha_feedback SET message = text WHERE message IS NULL AND text IS NOT NULL;
UPDATE public.mishpacha_feedback SET app_version = version WHERE app_version IS NULL AND version IS NOT NULL;

CREATE OR REPLACE FUNCTION public.mishpacha_feedback_sync_legacy()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $fn$
BEGIN
  IF NEW.message IS NULL AND NEW.text IS NOT NULL THEN NEW.message := NEW.text; END IF;
  IF NEW.app_version IS NULL AND NEW.version IS NOT NULL THEN NEW.app_version := NEW.version; END IF;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS mishpacha_feedback_sync_legacy_trg ON public.mishpacha_feedback;
CREATE TRIGGER mishpacha_feedback_sync_legacy_trg
  BEFORE INSERT OR UPDATE ON public.mishpacha_feedback
  FOR EACH ROW EXECUTE FUNCTION public.mishpacha_feedback_sync_legacy();
