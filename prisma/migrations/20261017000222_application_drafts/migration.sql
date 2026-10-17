-- CreateTable
CREATE TABLE "ApplicationDraft" (
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "step" TEXT NOT NULL DEFAULT 'cv',
    "cvDocumentId" TEXT,
    "profileOnly" BOOLEAN NOT NULL DEFAULT false,
    "coverLetter" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationDraft_pkey" PRIMARY KEY ("userId","jobId")
);

-- CreateIndex
CREATE INDEX "ApplicationDraft_jobId_idx" ON "ApplicationDraft"("jobId");

-- AddForeignKey
ALTER TABLE "ApplicationDraft" ADD CONSTRAINT "ApplicationDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationDraft" ADD CONSTRAINT "ApplicationDraft_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
