-- Page of a company on the phone (Ephraïm 27/10/2026): year of creation, international, networks.
ALTER TABLE "Organization" ADD COLUMN "foundedYear" INTEGER;
ALTER TABLE "Organization" ADD COLUMN "international" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Organization" ADD COLUMN "socialLinks" JSONB;
