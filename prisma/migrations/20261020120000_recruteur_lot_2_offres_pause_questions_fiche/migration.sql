-- Recruteur lot 2 (brief recruteur § 2.4, 2.5, 2.7) : mise en pause manuelle (hors quota
-- jobs.active.max), documents demandés, questions de présélection et réponses, fiche de poste PDF,
-- nombre de postes, domaine, consignes, vues par jour. Additive seulement.

-- AlterEnum
ALTER TYPE "JobStatus" ADD VALUE IF NOT EXISTS 'paused';

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "screeningAnswers" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "ApplicationDraft" ADD COLUMN     "screeningAnswers" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "applicationInstructions" TEXT,
ADD COLUMN     "domain" TEXT,
ADD COLUMN     "jobSheetKey" TEXT,
ADD COLUMN     "jobSheetName" TEXT,
ADD COLUMN     "jobSheetPages" INTEGER,
ADD COLUMN     "jobSheetSize" INTEGER,
ADD COLUMN     "jobSheetText" JSONB,
ADD COLUMN     "openings" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "pausedAt" TIMESTAMP(3),
ADD COLUMN     "requestedDocuments" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "screeningQuestions" JSONB NOT NULL DEFAULT '[]';

-- CreateTable
CREATE TABLE "JobViewDay" (
    "jobId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "JobViewDay_pkey" PRIMARY KEY ("jobId","day")
);

-- AddForeignKey
ALTER TABLE "JobViewDay" ADD CONSTRAINT "JobViewDay_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
