-- CreateEnum
CREATE TYPE "InterviewSimMode" AS ENUM ('text', 'voice');

-- CreateEnum
CREATE TYPE "InterviewSimStatus" AS ENUM ('active', 'completed');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "jobFamilies" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "jobSpecific" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "TalentProfile" ADD COLUMN     "portfolioAccent" TEXT,
ADD COLUMN     "portfolioIntro" TEXT,
ADD COLUMN     "portfolioLayout" TEXT NOT NULL DEFAULT 'classic',
ADD COLUMN     "portfolioPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "portfolioSlug" TEXT;

-- CreateTable
CREATE TABLE "InterviewSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" "InterviewSimMode" NOT NULL DEFAULT 'text',
    "type" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "jobId" TEXT,
    "durationMinutes" INTEGER NOT NULL,
    "questions" JSONB NOT NULL DEFAULT '[]',
    "feedback" JSONB,
    "status" "InterviewSimStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "InterviewSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InterviewSession_userId_createdAt_idx" ON "InterviewSession"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TalentProfile_portfolioSlug_key" ON "TalentProfile"("portfolioSlug");

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

