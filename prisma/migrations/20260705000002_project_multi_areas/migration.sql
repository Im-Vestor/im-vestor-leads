-- CreateTable (implicit m2m: A = areas.id, B = projects.id)
CREATE TABLE "_AreaToProject" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AreaToProject_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_AreaToProject_B_index" ON "_AreaToProject"("B");

-- AddForeignKey
ALTER TABLE "_AreaToProject" ADD CONSTRAINT "_AreaToProject_A_fkey" FOREIGN KEY ("A") REFERENCES "areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AreaToProject" ADD CONSTRAINT "_AreaToProject_B_fkey" FOREIGN KEY ("B") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Copy existing single-area links before dropping the column
INSERT INTO "_AreaToProject" ("A", "B")
SELECT "areaId", "id" FROM "projects";

-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_areaId_fkey";

-- DropIndex
DROP INDEX "projects_status_areaId_idx";

-- DropColumn
ALTER TABLE "projects" DROP COLUMN "areaId";
