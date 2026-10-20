-- Recruteur lot 5 : les échanges avec Orbi tenus depuis l'espace d'une organisation (historique
-- et crédits de l'organisation). Migration additive, aucune donnée supprimée.

-- AlterTable
ALTER TABLE "OrbiConversation" ADD COLUMN "organizationId" TEXT;

-- CreateIndex
CREATE INDEX "OrbiConversation_userId_organizationId_updatedAt_idx" ON "OrbiConversation"("userId", "organizationId", "updatedAt");
