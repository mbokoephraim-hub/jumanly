-- Profil d'une personne (docs/profil-personne): alias, réseaux et e-mail public.
ALTER TABLE "TalentProfile" ADD COLUMN "handle" TEXT,
ADD COLUMN "socialLinks" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN "showEmail" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "TalentProfile_handle_key" ON "TalentProfile"("handle");
