-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "opensAt" TIMESTAMP(3),
ADD COLUMN     "opensById" TEXT;

-- CreateIndex
CREATE INDEX "Job_opensAt_idx" ON "Job"("opensAt");
