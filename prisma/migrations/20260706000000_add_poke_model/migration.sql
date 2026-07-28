-- RECONSTRUCTED. This migration is recorded as applied in existing databases,
-- but its folder was lost from `prisma/migrations`. The SQL below was rebuilt
-- from the live schema (columns, indexes, constraints and enum values as they
-- exist today) so that a fresh database ends up in the same shape. It does not
-- re-run on databases that already have it recorded.

-- Introduction request between two members.
CREATE TYPE "PokeStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- Poke activity feeds the in-app notification bell.
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'POKE_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'POKE_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'POKE_REJECTED';

CREATE TABLE "pokes" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "PokeStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "pokes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pokes_senderId_receiverId_status_idx" ON "pokes" ("senderId", "receiverId", "status");
CREATE INDEX "pokes_receiverId_senderId_status_idx" ON "pokes" ("receiverId", "senderId", "status");
CREATE INDEX "pokes_receiverId_status_idx" ON "pokes" ("receiverId", "status");
CREATE INDEX "pokes_senderId_status_idx" ON "pokes" ("senderId", "status");
CREATE INDEX "pokes_status_expiresAt_idx" ON "pokes" ("status", "expiresAt");

-- One outstanding poke per direction. Prisma cannot express partial indexes, so
-- this constraint exists only here and is invisible to `schema.prisma`.
CREATE UNIQUE INDEX "pokes_pending_unique" ON "pokes" ("senderId", "receiverId") WHERE "status" = 'PENDING';

ALTER TABLE "pokes" ADD CONSTRAINT "pokes_senderId_fkey"
  FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pokes" ADD CONSTRAINT "pokes_receiverId_fkey"
  FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
