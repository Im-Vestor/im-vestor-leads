-- The migrations that added the poke notification types were removed from
-- `prisma/migrations`, but the enum values — and rows using them — survive in
-- existing databases. Prisma refuses to read a column whose stored value is
-- absent from its schema, so the values are declared here to make the schema
-- match reality. Idempotent: a no-op where they already exist, correct on a
-- fresh database.
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'POKE_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'POKE_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'POKE_REJECTED';
