-- AlterTable
ALTER TABLE "VerificationRequest" ADD COLUMN     "checkAt" TIMESTAMP(3),
ADD COLUMN     "checkById" TEXT,
ADD COLUMN     "checkRemindedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "VerificationRequest_checkAt_idx" ON "VerificationRequest"("checkAt");
