-- CreateEnum
CREATE TYPE "LicenseStatus" AS ENUM ('available', 'active', 'revoked', 'expired');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "partnerKind" TEXT;

-- CreateTable
CREATE TABLE "LicenseBatch" (
    "id" TEXT NOT NULL,
    "partnerOrgId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "seats" INTEGER NOT NULL,
    "months" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "contractRef" TEXT,
    "priceCents" INTEGER,
    "minGroup" INTEGER NOT NULL DEFAULT 10,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LicenseBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "License" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT,
    "invitedEmail" TEXT,
    "invitedAt" TIMESTAMP(3),
    "linkId" TEXT,
    "userId" TEXT,
    "subscriptionId" TEXT,
    "status" "LicenseStatus" NOT NULL DEFAULT 'available',
    "activatedAt" TIMESTAMP(3),
    "outcomeConsentAt" TIMESTAMP(3),
    "outcomeConsentAnsweredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "License_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LicenseLink" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "maxUses" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "disabledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LicenseLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LicenseBatch_partnerOrgId_idx" ON "LicenseBatch"("partnerOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "License_code_key" ON "License"("code");

-- CreateIndex
CREATE UNIQUE INDEX "License_subscriptionId_key" ON "License"("subscriptionId");

-- CreateIndex
CREATE INDEX "License_batchId_status_idx" ON "License"("batchId", "status");

-- CreateIndex
CREATE INDEX "License_userId_idx" ON "License"("userId");

-- CreateIndex
CREATE INDEX "License_batchId_invitedEmail_idx" ON "License"("batchId", "invitedEmail");

-- CreateIndex
CREATE UNIQUE INDEX "LicenseLink_token_key" ON "LicenseLink"("token");

-- AddForeignKey
ALTER TABLE "LicenseBatch" ADD CONSTRAINT "LicenseBatch_partnerOrgId_fkey" FOREIGN KEY ("partnerOrgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseBatch" ADD CONSTRAINT "LicenseBatch_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "License" ADD CONSTRAINT "License_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "LicenseBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "License" ADD CONSTRAINT "License_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "LicenseLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "License" ADD CONSTRAINT "License_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseLink" ADD CONSTRAINT "LicenseLink_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "LicenseBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
