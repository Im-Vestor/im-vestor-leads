-- CreateEnum
CREATE TYPE "ProjectStage" AS ENUM ('PRE_SEED', 'SEED', 'SERIES_A', 'SERIES_B', 'SERIES_C', 'IPO');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'EUR', 'BRL');

-- CreateEnum
CREATE TYPE "ProjectMediaType" AS ENUM ('PHOTO', 'VIDEO');

-- CreateTable
CREATE TABLE "areas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quickSolution" TEXT,
    "about" TEXT,
    "website" TEXT,
    "country" TEXT,
    "stage" "ProjectStage",
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" "Currency" NOT NULL DEFAULT 'EUR',
    "investmentGoal" INTEGER NOT NULL,
    "startInvestment" INTEGER,
    "equity" DOUBLE PRECISION,
    "annualRevenue" INTEGER,
    "monthsToReturn" INTEGER,
    "investorSlots" INTEGER,
    "logo" TEXT,
    "videoPitchUrl" TEXT,
    "areaId" TEXT NOT NULL,
    "entrepreneurId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_media" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "ProjectMediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "project_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "areas_name_key" ON "areas"("name");

-- CreateIndex
CREATE INDEX "projects_entrepreneurId_idx" ON "projects"("entrepreneurId");

-- CreateIndex
CREATE INDEX "projects_status_areaId_idx" ON "projects"("status", "areaId");

-- CreateIndex
CREATE INDEX "projects_status_createdAt_idx" ON "projects"("status", "createdAt");

-- CreateIndex
CREATE INDEX "project_media_projectId_idx" ON "project_media"("projectId");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_entrepreneurId_fkey" FOREIGN KEY ("entrepreneurId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_media" ADD CONSTRAINT "project_media_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed areas (mirrors the existing Sector enum labels; deterministic ids across envs)
INSERT INTO "areas" ("id", "name") VALUES
  ('area_technology', 'Technology'),
  ('area_healthcare', 'Healthcare'),
  ('area_fintech', 'Fintech'),
  ('area_edtech', 'EdTech'),
  ('area_cleantech', 'CleanTech'),
  ('area_ecommerce', 'E-Commerce'),
  ('area_saas', 'SaaS'),
  ('area_agritech', 'AgriTech'),
  ('area_proptech', 'PropTech'),
  ('area_biotech', 'BioTech')
ON CONFLICT ("name") DO NOTHING;
