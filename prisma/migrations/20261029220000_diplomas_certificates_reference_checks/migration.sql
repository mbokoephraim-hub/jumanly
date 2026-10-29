-- Diplômes et certificats séparés, photo du document, vérification par un référent
-- (demande d'Ephraïm du 29/10/2026).
CREATE TYPE "EducationKind" AS ENUM ('diploma', 'certificate');
CREATE TYPE "TrainingFormat" AS ENUM ('online', 'in_person', 'hybrid');
CREATE TYPE "TrainingLength" AS ENUM ('short', 'long');
CREATE TYPE "ReferenceCheckStatus" AS ENUM ('pending', 'confirmed', 'declined', 'cancelled');

ALTER TABLE "Education" ADD COLUMN "kind" "EducationKind" NOT NULL DEFAULT 'diploma';
ALTER TABLE "Education" ADD COLUMN "format" "TrainingFormat";
ALTER TABLE "Education" ADD COLUMN "length" "TrainingLength";
ALTER TABLE "Education" ADD COLUMN "image" TEXT;

CREATE TABLE "ReferenceCheck" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "experienceId" TEXT,
    "educationId" TEXT,
    "referentName" TEXT NOT NULL,
    "referentEmail" TEXT NOT NULL,
    "referentRole" TEXT,
    "tokenHash" TEXT NOT NULL,
    "status" "ReferenceCheckStatus" NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferenceCheck_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReferenceCheck_tokenHash_key" ON "ReferenceCheck"("tokenHash");
CREATE INDEX "ReferenceCheck_profileId_idx" ON "ReferenceCheck"("profileId");
CREATE INDEX "ReferenceCheck_experienceId_idx" ON "ReferenceCheck"("experienceId");
CREATE INDEX "ReferenceCheck_educationId_idx" ON "ReferenceCheck"("educationId");

ALTER TABLE "ReferenceCheck" ADD CONSTRAINT "ReferenceCheck_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "TalentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReferenceCheck" ADD CONSTRAINT "ReferenceCheck_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReferenceCheck" ADD CONSTRAINT "ReferenceCheck_educationId_fkey" FOREIGN KEY ("educationId") REFERENCES "Education"("id") ON DELETE CASCADE ON UPDATE CASCADE;
