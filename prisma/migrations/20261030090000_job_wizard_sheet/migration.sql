-- Publication d'offre étape par étape (29/10/2026): soft skills, the company's text of the job
-- sheet, the title of the Fil post published with the offer.
CREATE TYPE "JobSkillKind" AS ENUM ('hard', 'soft');

ALTER TABLE "JobSkill" ADD COLUMN "kind" "JobSkillKind" NOT NULL DEFAULT 'hard';

ALTER TABLE "Job" ADD COLUMN "companyAbout" TEXT,
ADD COLUMN "feedTitle" TEXT,
ADD COLUMN "feedText" TEXT,
ADD COLUMN "sheetCode" TEXT;

CREATE UNIQUE INDEX "Job_sheetCode_key" ON "Job"("sheetCode");
