-- Retour arrière du prompt 4 bis (migration 20261017125314_organization_banner).
-- Supprime la bannière des organisations. Le logo (Organization.logo) existait avant et reste.
-- Les images envoyées restent dans StoredFile sous « public/orgs/ » ; les supprimer si besoin :
--   DELETE FROM "StoredFile" WHERE key LIKE 'public/orgs/%/banner-%';
BEGIN;
ALTER TABLE "Organization" DROP COLUMN IF EXISTS "banner";
DELETE FROM "_prisma_migrations" WHERE migration_name = '20261017125314_organization_banner';
COMMIT;
