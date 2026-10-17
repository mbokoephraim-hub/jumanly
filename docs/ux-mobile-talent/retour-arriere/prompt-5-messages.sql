-- Retour arrière du prompt 5 (migration 20261017015124_message_kinds_and_templates).
-- À lancer seulement après être revenu au code d'avant le prompt 5.
-- Les messages des nouveaux types sont gardés : ils redeviennent de simples messages texte
-- (le fichier envoyé reste dans payload.document, que l'ancien code sait déjà ouvrir).
BEGIN;
UPDATE "Message" SET "kind" = 'text' WHERE "kind" IN ('file', 'slot', 'decision');
ALTER TYPE "MessageKind" RENAME TO "MessageKind_new";
CREATE TYPE "MessageKind" AS ENUM ('text', 'document_request', 'invitation', 'system');
ALTER TABLE "Message" ALTER COLUMN "kind" DROP DEFAULT;
ALTER TABLE "Message" ALTER COLUMN "kind" TYPE "MessageKind" USING ("kind"::text::"MessageKind");
ALTER TABLE "Message" ALTER COLUMN "kind" SET DEFAULT 'text';
DROP TYPE "MessageKind_new";
DROP TABLE "MessageTemplate";
DROP TYPE "MessageTemplateKind";
DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20261017015124_message_kinds_and_templates';
COMMIT;
