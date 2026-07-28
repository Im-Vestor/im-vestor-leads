-- A poke notification has to name the request it is about: the bell answers a
-- poke in place, so the row needs the id the Accept/Reject buttons act on.
-- Nullable because every other notification type leaves it empty.
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "pokeId" TEXT;

-- Answering a poke deletes nothing, but a deleted poke must not leave rows
-- pointing at a request that no longer exists.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notifications_pokeId_fkey'
  ) THEN
    ALTER TABLE "notifications" ADD CONSTRAINT "notifications_pokeId_fkey"
      FOREIGN KEY ("pokeId") REFERENCES "pokes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "notifications_pokeId_idx" ON "notifications" ("pokeId");
