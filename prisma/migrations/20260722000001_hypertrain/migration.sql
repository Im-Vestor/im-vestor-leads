-- Hypertrain: purchasable tickets that feature a project or investor profile
-- on the dashboard carousel for 7 days.
ALTER TABLE "users" ADD COLUMN "hypertrainTickets" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "hypertrainUntil" TIMESTAMP(3);
ALTER TABLE "projects" ADD COLUMN "hypertrainUntil" TIMESTAMP(3);
