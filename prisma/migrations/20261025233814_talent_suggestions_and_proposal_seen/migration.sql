-- AlterTable
ALTER TABLE "ContactRequest" ADD COLUMN     "seenAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "HiddenTalentSuggestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HiddenTalentSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HiddenTalentSuggestion_userId_organizationId_profileId_key" ON "HiddenTalentSuggestion"("userId", "organizationId", "profileId");

-- AddForeignKey
ALTER TABLE "HiddenTalentSuggestion" ADD CONSTRAINT "HiddenTalentSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HiddenTalentSuggestion" ADD CONSTRAINT "HiddenTalentSuggestion_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HiddenTalentSuggestion" ADD CONSTRAINT "HiddenTalentSuggestion_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "TalentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
