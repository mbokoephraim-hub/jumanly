-- Test de la plateforme avec la liste d'attente (30/10/2026) : invitation avec le lien
-- d'inscription caché, période de test, puis questionnaire dont les réponses se lisent dans l'admin.
ALTER TABLE "WaitlistEntry" ADD COLUMN "invitedAt" TIMESTAMP(3),
ADD COLUMN "inviteCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "testEndsAt" TIMESTAMP(3),
ADD COLUMN "surveyToken" TEXT,
ADD COLUMN "surveySentAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "WaitlistEntry_surveyToken_key" ON "WaitlistEntry"("surveyToken");
CREATE INDEX "WaitlistEntry_testEndsAt_idx" ON "WaitlistEntry"("testEndsAt");

CREATE TABLE "TestFeedback" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "overall" INTEGER NOT NULL,
    "ease" INTEGER NOT NULL,
    "design" INTEGER NOT NULL,
    "usefulness" INTEGER NOT NULL,
    "speed" INTEGER NOT NULL,
    "recommend" INTEGER NOT NULL,
    "areas" TEXT[],
    "device" TEXT NOT NULL,
    "liked" TEXT,
    "problems" TEXT,
    "improvements" TEXT NOT NULL,
    "comments" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'fr',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestFeedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TestFeedback_entryId_key" ON "TestFeedback"("entryId");
CREATE INDEX "TestFeedback_createdAt_idx" ON "TestFeedback"("createdAt");

ALTER TABLE "TestFeedback" ADD CONSTRAINT "TestFeedback_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "WaitlistEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
