-- Retour arrière du prompt 4 (docs/ux-mobile-talent) : supprime seulement la table des brouillons de
-- candidature. Les candidatures envoyées (table "Application") ne sont pas touchées.
-- Ensuite : retirer le modèle ApplicationDraft de prisma/schema.prisma et la ligne de la migration
-- 20261017000222_application_drafts dans la table _prisma_migrations.
DROP TABLE IF EXISTS "ApplicationDraft";
DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20261017000222_application_drafts';
