-- CreateTable
CREATE TABLE "project_unlocks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_unlocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_unlocks_projectId_idx" ON "project_unlocks"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "project_unlocks_userId_projectId_key" ON "project_unlocks"("userId", "projectId");

-- AddForeignKey
ALTER TABLE "project_unlocks" ADD CONSTRAINT "project_unlocks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_unlocks" ADD CONSTRAINT "project_unlocks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
