-- Offre étape par étape (retours du 29/10/2026): plusieurs niveaux d'études, confirmation ONEM.
-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "educationLevels" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "onemConfirmedAt" TIMESTAMP(3);

UPDATE "Job" SET "educationLevels" = ARRAY["educationLevelMin"] WHERE "educationLevelMin" IS NOT NULL;
