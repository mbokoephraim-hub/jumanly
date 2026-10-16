-- Retour arrière de la migration 20261016181418_learn_paths (Learn v2, étape 2).
-- Supprime uniquement les parcours ; les formations, inscriptions et progressions restent.
-- À exécuter avant le retour arrière de l'étape 1 (les parcours utilisent les domaines).
DROP TABLE IF EXISTS "LearningPathFollow";
DROP TABLE IF EXISTS "LearningPathCourse";
DROP TABLE IF EXISTS "LearningPath";
DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20261016181418_learn_paths';
