-- Liste d'attente du site public (29/10/2026): inscriptions fermées, les visiteurs laissent leurs
-- coordonnées et reçoivent un e-mail de confirmation.
CREATE TYPE "WaitlistProfile" AS ENUM ('talent', 'recruiter', 'company', 'partner');

CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "profile" "WaitlistProfile" NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT,
    "organization" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'fr',
    "emailSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WaitlistEntry_email_key" ON "WaitlistEntry"("email");
CREATE INDEX "WaitlistEntry_createdAt_idx" ON "WaitlistEntry"("createdAt");
CREATE INDEX "WaitlistEntry_profile_idx" ON "WaitlistEntry"("profile");
