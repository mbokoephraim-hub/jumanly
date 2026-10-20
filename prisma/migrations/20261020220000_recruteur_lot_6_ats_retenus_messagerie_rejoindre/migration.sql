-- Recruteur lot 6 : ATS (analyse programmée, ajout des nouvelles), liste des retenus, messagerie
-- (retirer, épingler, couper, en ligne, accusés de lecture), relance des propositions, rappels de
-- fin d'offre et demandes pour rejoindre une organisation. Migration additive, aucune donnée supprimée.

-- CreateEnum
CREATE TYPE "JoinRequestStatus" AS ENUM ('pending', 'accepted', 'declined', 'expired', 'cancelled');

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "shortlistedAt" TIMESTAMP(3),
ADD COLUMN     "shortlistedById" TEXT;

-- AlterTable
ALTER TABLE "ContactRequest" ADD COLUMN     "remindedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "orgHiddenAt" TIMESTAMP(3),
ADD COLUMN     "orgPinnedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ConversationParticipant" ADD COLUMN     "mutedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "atsAtClose" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "atsAutoAdd" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "atsRanAt" TIMESTAMP(3),
ADD COLUMN     "atsRun" JSONB,
ADD COLUMN     "atsScheduledById" TEXT,
ADD COLUMN     "endingReminders" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "endingReminders" TEXT[] DEFAULT ARRAY['d3']::TEXT[],
ADD COLUMN     "lastSeenAt" TIMESTAMP(3),
ADD COLUMN     "readReceipts" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showPresence" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "OrgJoinRequest" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchedBy" TEXT NOT NULL,
    "status" "JoinRequestStatus" NOT NULL DEFAULT 'pending',
    "role" "MembershipRole",
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "respondedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgJoinRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrgJoinRequest_organizationId_status_idx" ON "OrgJoinRequest"("organizationId", "status");

-- CreateIndex
CREATE INDEX "OrgJoinRequest_userId_status_idx" ON "OrgJoinRequest"("userId", "status");

-- AddForeignKey
ALTER TABLE "OrgJoinRequest" ADD CONSTRAINT "OrgJoinRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgJoinRequest" ADD CONSTRAINT "OrgJoinRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
