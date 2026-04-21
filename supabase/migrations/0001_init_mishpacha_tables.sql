-- Mishpacha Mega v1.0 — Supabase tables
-- Run in Supabase SQL editor once. RLS policies mirror pnimit/samega pattern.

CREATE TABLE IF NOT EXISTS mishpacha_backups (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE mishpacha_backups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon insert" ON mishpacha_backups FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon update" ON mishpacha_backups FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon select" ON mishpacha_backups FOR SELECT TO anon USING (true);
-- No DELETE policy (anti-wipe guard)

CREATE TABLE IF NOT EXISTS mishpacha_feedback (
  id bigserial PRIMARY KEY,
  type text,
  text text,
  ts bigint,
  version text,
  uid text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE mishpacha_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon insert" ON mishpacha_feedback FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon select" ON mishpacha_feedback FOR SELECT TO anon USING (true);

CREATE TABLE IF NOT EXISTS mishpacha_leaderboard (
  uid text PRIMARY KEY,
  answered int,
  correct int,
  streak int,
  readiness int,
  accuracy real,
  ts bigint,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE mishpacha_leaderboard ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon insert" ON mishpacha_leaderboard FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon update" ON mishpacha_leaderboard FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon select" ON mishpacha_leaderboard FOR SELECT TO anon USING (true);
