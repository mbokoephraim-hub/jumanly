-- Expériences : page d'entreprise liée et logo envoyé (demande d'Ephraïm du 29/10/2026).
ALTER TABLE "Experience" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "Experience" ADD COLUMN "logo" TEXT;

CREATE INDEX "Experience_organizationId_idx" ON "Experience"("organizationId");

ALTER TABLE "Experience" ADD CONSTRAINT "Experience_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
