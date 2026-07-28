-- RECONSTRUCTED. Folder lost from `prisma/migrations` while still recorded as
-- applied. The original was a one-time data backfill; its exact SQL is gone, so
-- the intent implied by its name is reimplemented here: an accepted poke means
-- the two members may talk, so each one needs a conversation.
--
-- Idempotent — it only inserts where no conversation already joins the pair, so
-- re-running changes nothing. On a fresh database there are no pokes and this
-- does nothing at all.
INSERT INTO "conversations" ("id", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::TEXT,
  p."respondedAt",
  p."respondedAt"
FROM "pokes" p
WHERE p."status" = 'ACCEPTED'
  AND NOT EXISTS (
    SELECT 1
    FROM "_ConversationParticipants" a
    JOIN "_ConversationParticipants" b ON b."A" = a."A"
    WHERE a."B" = p."senderId"
      AND b."B" = p."receiverId"
  );

-- Attach both members to the conversations just created. They are the only ones
-- with no participants yet.
INSERT INTO "_ConversationParticipants" ("A", "B")
SELECT c."id", u."id"
FROM "conversations" c
CROSS JOIN LATERAL (
  SELECT p."senderId" AS id FROM "pokes" p
  WHERE p."status" = 'ACCEPTED' AND p."respondedAt" = c."createdAt"
  UNION
  SELECT p."receiverId" FROM "pokes" p
  WHERE p."status" = 'ACCEPTED' AND p."respondedAt" = c."createdAt"
) u
WHERE NOT EXISTS (
  SELECT 1 FROM "_ConversationParticipants" cp WHERE cp."A" = c."id"
);
