-- Retour arrière du prompt 3 bis (migration 20261017115314_places).
-- Supprime le référentiel des pays et des lieux et les pays souhaités des profils.
-- Les villes souhaitées (TalentProfile.desiredLocations) existaient avant et restent.
BEGIN;
ALTER TABLE "TalentProfile" DROP COLUMN IF EXISTS "desiredCountries";
DROP TABLE IF EXISTS "Locality";
DROP TABLE IF EXISTS "Country";
DROP TYPE IF EXISTS "LocalityKind";
DROP TYPE IF EXISTS "PlaceRegion";
DELETE FROM "_prisma_migrations" WHERE migration_name = '20261017115314_places';
COMMIT;
