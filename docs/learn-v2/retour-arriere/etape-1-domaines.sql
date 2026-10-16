-- Retour arrière de la migration 20261016164659_learn_domains (Learn v2, étape 1).
-- Supprime uniquement ce que la migration a ajouté ; les formations gardent leur thème (category).
ALTER TABLE "Course" DROP CONSTRAINT IF EXISTS "Course_domainId_fkey";
DROP INDEX IF EXISTS "Course_domainId_idx";
ALTER TABLE "Course" DROP COLUMN IF EXISTS "domainId", DROP COLUMN IF EXISTS "editorialLine";
DROP TABLE IF EXISTS "LearningDomain";
DROP TYPE IF EXISTS "EditorialLine";
DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20261016164659_learn_domains';
