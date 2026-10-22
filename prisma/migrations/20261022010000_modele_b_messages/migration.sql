-- Modèle B, lot B8 (Messages au téléphone): additive only.
ALTER TYPE "MessageKind" ADD VALUE 'image';
ALTER TYPE "MessageKind" ADD VALUE 'voice';
ALTER TYPE "MessageKind" ADD VALUE 'contact';
ALTER TYPE "MessageKind" ADD VALUE 'organization';

ALTER TABLE "Connection" ADD COLUMN "note" TEXT;
ALTER TABLE "Conversation" ADD COLUMN "ephemeralSeconds" INTEGER;
ALTER TABLE "ConversationParticipant" ADD COLUMN "clearedAt" TIMESTAMP(3);
ALTER TABLE "Message" ADD COLUMN "expiresAt" TIMESTAMP(3);
