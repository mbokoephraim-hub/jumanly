-- CreateEnum
CREATE TYPE "Availability" AS ENUM ('open', 'listening', 'not_looking');

-- CreateEnum
CREATE TYPE "ExperienceType" AS ENUM ('job', 'internship', 'freelance', 'volunteer', 'entrepreneur');

-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('none', 'secondary', 'vocational', 'bachelor', 'master', 'doctorate');

-- CreateEnum
CREATE TYPE "DocumentKind" AS ENUM ('cv', 'cover_letter', 'bio', 'portfolio_item', 'other');

-- CreateEnum
CREATE TYPE "DiagnosticLevel" AS ENUM ('simple', 'personalized');

-- CreateEnum
CREATE TYPE "StageKind" AS ENUM ('new', 'screening', 'test', 'interview', 'offer', 'hired', 'rejected');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('active', 'withdrawn', 'rejected', 'hired');

-- CreateEnum
CREATE TYPE "ApplicationSource" AS ENUM ('direct', 'invitation', 'talent_search');

-- AlterTable
ALTER TABLE "ProfileSkill" ADD COLUMN     "proof" TEXT,
ADD COLUMN     "proofUrl" TEXT;

-- AlterTable
ALTER TABLE "TalentProfile" ADD COLUMN     "availability" "Availability" NOT NULL DEFAULT 'open',
ADD COLUMN     "availableFrom" TIMESTAMP(3),
ADD COLUMN     "completeness" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "desiredContracts" TEXT[],
ADD COLUMN     "desiredJobTitles" TEXT[],
ADD COLUMN     "desiredLocations" TEXT[],
ADD COLUMN     "languages" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "notice" TEXT,
ADD COLUMN     "relocation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "remotePreferences" "RemoteMode"[],
ADD COLUMN     "salaryCurrency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "salaryMin" INTEGER,
ADD COLUMN     "salaryPeriod" TEXT NOT NULL DEFAULT 'month',
ADD COLUMN     "sectors" TEXT[],
ADD COLUMN     "summary" TEXT;

-- CreateTable
CREATE TABLE "Experience" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "type" "ExperienceType" NOT NULL DEFAULT 'job',
    "location" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Experience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Education" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "level" "EducationLevel" NOT NULL,
    "field" TEXT,
    "school" TEXT NOT NULL,
    "startYear" INTEGER,
    "endYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "kind" "DocumentKind" NOT NULL,
    "title" TEXT NOT NULL,
    "templateId" TEXT NOT NULL DEFAULT 'classic',
    "content" JSONB NOT NULL DEFAULT '{}',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerDiagnostic" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "level" "DiagnosticLevel" NOT NULL,
    "answers" JSONB NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareerDiagnostic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineStage" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "kind" "StageKind" NOT NULL,

    CONSTRAINT "PipelineStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'active',
    "coverLetter" TEXT,
    "cvSnapshot" JSONB,
    "source" "ApplicationSource" NOT NULL DEFAULT 'direct',
    "viewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationEvent" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedJob" (
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedJob_pkey" PRIMARY KEY ("userId","jobId")
);

-- CreateIndex
CREATE INDEX "Experience_profileId_idx" ON "Experience"("profileId");

-- CreateIndex
CREATE INDEX "Education_profileId_idx" ON "Education"("profileId");

-- CreateIndex
CREATE INDEX "Document_profileId_kind_idx" ON "Document"("profileId", "kind");

-- CreateIndex
CREATE INDEX "CareerDiagnostic_userId_createdAt_idx" ON "CareerDiagnostic"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PipelineStage_jobId_order_key" ON "PipelineStage"("jobId", "order");

-- CreateIndex
CREATE INDEX "Application_profileId_status_idx" ON "Application"("profileId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Application_jobId_profileId_key" ON "Application"("jobId", "profileId");

-- CreateIndex
CREATE INDEX "ApplicationEvent_applicationId_createdAt_idx" ON "ApplicationEvent"("applicationId", "createdAt");

-- AddForeignKey
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "TalentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Education" ADD CONSTRAINT "Education_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "TalentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "TalentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerDiagnostic" ADD CONSTRAINT "CareerDiagnostic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineStage" ADD CONSTRAINT "PipelineStage_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "TalentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "PipelineStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationEvent" ADD CONSTRAINT "ApplicationEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedJob" ADD CONSTRAINT "SavedJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedJob" ADD CONSTRAINT "SavedJob_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
