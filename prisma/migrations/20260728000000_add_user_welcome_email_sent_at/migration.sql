-- Stamped the first time the welcome email is claimed for a user. The claim is
-- an atomic `UPDATE ... WHERE "welcomeEmailSentAt" IS NULL`, so concurrent
-- sign-up calls can never send the welcome twice.
ALTER TABLE "users" ADD COLUMN "welcomeEmailSentAt" TIMESTAMP(3);
