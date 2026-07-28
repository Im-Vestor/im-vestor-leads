-- Notifications grow from "a message arrived" into the full in-app feed behind
-- the header bell: one type per meaningful event, plus the destination the row
-- links to. Titles are derived from `type` and translated client-side, so
-- `message` holds only the dynamic detail (sender, project, preview).
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SUPPORT_REPLY';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'WELCOME';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'REFERRAL_JOINED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PROJECT_PUBLISHED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'LEAD_UNLOCKED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'HYPERTRAIN_ACTIVATED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PURCHASE_COMPLETED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SUBSCRIPTION_STARTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SUBSCRIPTION_RENEWED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SUBSCRIPTION_CANCELLED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PAYMENT_FAILED';

ALTER TABLE "notifications" ADD COLUMN "link" TEXT;

CREATE INDEX IF NOT EXISTS "notifications_userId_createdAt_idx"
  ON "notifications" ("userId", "createdAt");
