-- New users start with 2 pokes and 1 lead credit (both roles).
ALTER TABLE "users" ALTER COLUMN "pokes" SET DEFAULT 2;
ALTER TABLE "users" ALTER COLUMN "leadCredits" SET DEFAULT 1;
