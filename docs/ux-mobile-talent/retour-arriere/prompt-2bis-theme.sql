-- Retour arrière de la migration 20261017095528_user_theme (prompt 2 bis, thème Vert).
-- Le thème choisi par chaque personne est perdu ; l'interface revient au thème Clair.
ALTER TABLE "user" DROP COLUMN IF EXISTS "theme";
DROP TYPE IF EXISTS "UserTheme";
DELETE FROM "_prisma_migrations" WHERE migration_name = '20261017095528_user_theme';
