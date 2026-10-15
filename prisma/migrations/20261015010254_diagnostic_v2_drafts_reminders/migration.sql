-- AlterTable
ALTER TABLE "CareerDiagnostic" ADD COLUMN     "remindAt" TIMESTAMP(3),
ADD COLUMN     "remindedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "CareerDiagnosticDraft" (
    "userId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "step" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerDiagnosticDraft_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "CareerDiagnostic_remindAt_idx" ON "CareerDiagnostic"("remindAt");

-- AddForeignKey
ALTER TABLE "CareerDiagnosticDraft" ADD CONSTRAINT "CareerDiagnosticDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
