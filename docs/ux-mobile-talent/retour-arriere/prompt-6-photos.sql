-- Retour arrière du prompt 6 (photos de profil). À lancer seulement si la migration
-- 20261017052929_profile_photos doit être annulée : les photos enregistrées sont perdues,
-- les comptes gardent leurs initiales. Aucune autre table n'est touchée.
UPDATE "user" SET "image" = NULL WHERE "image" LIKE '/api/photo/%';
DROP TABLE IF EXISTS "ProfilePhoto";
DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20261017052929_profile_photos';
