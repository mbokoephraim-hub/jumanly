-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('pending', 'accepted', 'declined', 'blocked');

-- AlterEnum
ALTER TYPE "ConversationKind" ADD VALUE 'peer';

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "connectionId" TEXT;

-- CreateTable
CREATE TABLE "Connection" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "addresseeId" TEXT NOT NULL,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'pending',
    "blockedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "Connection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Connection_addresseeId_status_idx" ON "Connection"("addresseeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Connection_requesterId_addresseeId_key" ON "Connection"("requesterId", "addresseeId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_connectionId_key" ON "Conversation"("connectionId");

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_addresseeId_fkey" FOREIGN KEY ("addresseeId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "Connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

