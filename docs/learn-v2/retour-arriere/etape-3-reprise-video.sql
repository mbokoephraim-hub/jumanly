-- Retour arrière de la migration 20261016190010_learn_lesson_progress (Learn v2, étape 3).
-- Supprime seulement les positions de lecture ; les leçons terminées restent dans Enrollment.
DROP TABLE IF EXISTS "LessonProgress";
DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20261016190010_learn_lesson_progress';
