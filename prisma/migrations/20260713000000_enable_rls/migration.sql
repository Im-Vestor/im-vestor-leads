-- Enable Row Level Security on every table in the public schema.
-- No policies are added: Prisma connects as the `postgres` role (BYPASSRLS), so
-- app queries are unaffected, while the anon/authenticated Data API (PostgREST)
-- is denied all access. Idempotent — re-enabling RLS is a no-op.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
  END LOOP;
END $$;
