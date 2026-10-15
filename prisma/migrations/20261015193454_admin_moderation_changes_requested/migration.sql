-- AlterEnum
ALTER TYPE "JobStatus" ADD VALUE 'changes_requested';

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "moderationChecks" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "resolutionReason" TEXT;
