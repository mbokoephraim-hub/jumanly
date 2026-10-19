-- Refonte mobile, lot 2 : niveau et domaine d'études choisis aux premiers pas. Additive.
-- AlterTable
ALTER TABLE "TalentProfile" ADD COLUMN     "studyField" TEXT,
ADD COLUMN     "studyLevel" TEXT;
