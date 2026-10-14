-- pgvector: semantic proximity of the matching (partie 08).
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('pending', 'applied', 'ignored');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('open', 'in_review', 'corrected', 'confirmed');

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "matchExplanation" JSONB,
ADD COLUMN     "matchScore" INTEGER;

-- AlterTable
ALTER TABLE "TalentProfile" ADD COLUMN     "matchingEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "MatchingWeights" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "weights" JSONB NOT NULL,
    "activeFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchingWeights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchResult" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "band" TEXT NOT NULL,
    "explanation" JSONB NOT NULL,
    "weightsVersion" TEXT NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Embedding" (
    "id" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "vector" vector,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Embedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "organizationId" TEXT,
    "feature" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "costMicroUsd" INTEGER NOT NULL DEFAULT 0,
    "planCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ok',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiSuggestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "documentId" TEXT,
    "payload" JSONB NOT NULL,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchDispute" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "applicationId" TEXT,
    "reason" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "notifyRecruiter" BOOLEAN NOT NULL DEFAULT false,
    "scoreBefore" INTEGER NOT NULL,
    "scoreAfter" INTEGER,
    "status" "DisputeStatus" NOT NULL DEFAULT 'open',
    "resolution" TEXT,
    "resolvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "MatchDispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "steps" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgressPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MatchingWeights_version_key" ON "MatchingWeights"("version");

-- CreateIndex
CREATE INDEX "MatchResult_jobId_score_idx" ON "MatchResult"("jobId", "score");

-- CreateIndex
CREATE UNIQUE INDEX "MatchResult_profileId_jobId_key" ON "MatchResult"("profileId", "jobId");

-- CreateIndex
CREATE UNIQUE INDEX "Embedding_subjectType_subjectId_key" ON "Embedding"("subjectType", "subjectId");

-- CreateIndex
CREATE INDEX "AiUsage_feature_createdAt_idx" ON "AiUsage"("feature", "createdAt");

-- CreateIndex
CREATE INDEX "AiUsage_userId_createdAt_idx" ON "AiUsage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AiSuggestion_userId_feature_status_idx" ON "AiSuggestion"("userId", "feature", "status");

-- CreateIndex
CREATE INDEX "MatchDispute_status_createdAt_idx" ON "MatchDispute"("status", "createdAt");

-- CreateIndex
CREATE INDEX "MatchDispute_userId_idx" ON "MatchDispute"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgressPlan_userId_key" ON "ProgressPlan"("userId");

-- AddForeignKey
ALTER TABLE "MatchResult" ADD CONSTRAINT "MatchResult_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "TalentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchResult" ADD CONSTRAINT "MatchResult_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiUsage" ADD CONSTRAINT "AiUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiSuggestion" ADD CONSTRAINT "AiSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchDispute" ADD CONSTRAINT "MatchDispute_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressPlan" ADD CONSTRAINT "ProgressPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
