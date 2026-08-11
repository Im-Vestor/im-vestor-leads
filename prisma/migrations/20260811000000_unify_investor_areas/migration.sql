-- Investors now pick their areas of interest from the shared Area list
-- (same table projects use) instead of the fixed Sector enum.

-- CreateTable (implicit m2m: A = areas.id, B = users.id)
CREATE TABLE "_AreaToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AreaToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_AreaToUser_B_index" ON "_AreaToUser"("B");

-- AddForeignKey
ALTER TABLE "_AreaToUser" ADD CONSTRAINT "_AreaToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AreaToUser" ADD CONSTRAINT "_AreaToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: map each investor's Sector enum values to Area rows by name.
-- TECHNOLOGY has no equivalent area (the CASE yields NULL and the join drops it),
-- so those investors simply re-pick an area next time they edit their profile.
INSERT INTO "_AreaToUser" ("A", "B")
SELECT a."id", u."id"
FROM "users" u
CROSS JOIN LATERAL unnest(u."sectors") AS s(sector)
JOIN "areas" a ON a."name" = (
  CASE s.sector::text
    WHEN 'HEALTHCARE' THEN 'Healthcare'
    WHEN 'FINTECH'    THEN 'Fintech'
    WHEN 'EDTECH'     THEN 'EdTech'
    WHEN 'ECOMMERCE'  THEN 'E-commerce'
    WHEN 'AGRITECH'   THEN 'AgriTech'
    WHEN 'BIOTECH'    THEN 'Biotech'
    WHEN 'SAAS'       THEN 'SaaS'
    WHEN 'PROPTECH'   THEN 'PropTech'
    WHEN 'CLEANTECH'  THEN 'ClimateTech'
  END
)
ON CONFLICT DO NOTHING;

-- Drop the now-unused enum column and type.
ALTER TABLE "users" DROP COLUMN "sectors";
DROP TYPE "Sector";

-- Match the RLS convention (see 20260713000000_enable_rls); Prisma is BYPASSRLS.
ALTER TABLE "_AreaToUser" ENABLE ROW LEVEL SECURITY;
