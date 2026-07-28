-- RECONSTRUCTED. Folder lost from `prisma/migrations` while still recorded as
-- applied. Rebuilt from the live `supabase_realtime` publication, which today
-- carries `messages` and `notifications` — despite the migration name, `pokes`
-- is not a member, so it is not added here.
--
-- Supabase Realtime only streams tables in this publication; the chat and the
-- notification bell both depend on it. Guarded so it is a no-op when a table is
-- already a member, and skipped entirely on a Postgres without the publication.
DO $$
DECLARE
  t TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    RAISE NOTICE 'supabase_realtime publication not found — skipping';
    RETURN;
  END IF;

  FOREACH t IN ARRAY ARRAY['messages', 'notifications']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t)
      AND NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
      )
    THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', t);
    END IF;
  END LOOP;
END $$;
