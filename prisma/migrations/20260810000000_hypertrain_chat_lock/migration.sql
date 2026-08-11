-- Link conversations to a project (lead/hypertrain chats). Null = free chat.
ALTER TABLE "conversations" ADD COLUMN "projectId" TEXT;

CREATE INDEX "conversations_projectId_idx" ON "conversations"("projectId");

ALTER TABLE "conversations" ADD CONSTRAINT "conversations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Entrepreneur permanently unlocking an investor's lead (mirror of project_unlocks).
CREATE TABLE "investor_unlocks" (
    "id" TEXT NOT NULL,
    "entrepreneurId" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investor_unlocks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "investor_unlocks_investorId_idx" ON "investor_unlocks"("investorId");

CREATE UNIQUE INDEX "investor_unlocks_entrepreneurId_investorId_key" ON "investor_unlocks"("entrepreneurId", "investorId");

ALTER TABLE "investor_unlocks" ADD CONSTRAINT "investor_unlocks_entrepreneurId_fkey" FOREIGN KEY ("entrepreneurId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "investor_unlocks" ADD CONSTRAINT "investor_unlocks_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Match the RLS convention (see 20260713000000_enable_rls); Prisma connects as BYPASSRLS postgres.
ALTER TABLE "investor_unlocks" ENABLE ROW LEVEL SECURITY;
