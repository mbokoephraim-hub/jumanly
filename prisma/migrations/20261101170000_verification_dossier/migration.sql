-- « Dossier de vérification » (logique du recrutement, étape 3)
CREATE TYPE "VerificationPiece" AS ENUM ('diploma', 'transcript', 'referent', 'thesis', 'certificate', 'portfolio', 'test');

CREATE TABLE "VerificationRequest" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT,
    "message" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "remindersSent" INTEGER NOT NULL DEFAULT 0,
    "lastReminderAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VerificationRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VerificationItem" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "kind" "VerificationPiece" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "fileKey" TEXT,
    "fileName" TEXT,
    "contentType" TEXT,
    "certificateCode" TEXT,
    "educationId" TEXT,
    "referentName" TEXT,
    "referentEmail" TEXT,
    "note" TEXT,
    "checks" JSONB NOT NULL DEFAULT '[]',
    "receivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VerificationItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VerificationRequest_applicationId_key" ON "VerificationRequest"("applicationId");
CREATE INDEX "VerificationRequest_organizationId_dueAt_idx" ON "VerificationRequest"("organizationId", "dueAt");
CREATE INDEX "VerificationItem_requestId_idx" ON "VerificationItem"("requestId");

ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VerificationItem" ADD CONSTRAINT "VerificationItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "VerificationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
