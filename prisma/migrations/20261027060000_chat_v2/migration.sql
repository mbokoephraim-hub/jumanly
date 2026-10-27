-- Chat v2 (docs/chat-v2): pin and « écrit… » per person, reactions, video calls (never recorded).
ALTER TABLE "ConversationParticipant" ADD COLUMN "pinnedAt" TIMESTAMP(3),
ADD COLUMN "typingAt" TIMESTAMP(3);

CREATE TYPE "VideoCallStatus" AS ENUM ('ringing', 'active', 'ended', 'missed');

CREATE TABLE "MessageReaction" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageReaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VideoCall" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "callerId" TEXT NOT NULL,
    "status" "VideoCallStatus" NOT NULL DEFAULT 'ringing',
    "provider" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "answeredAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoCall_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MessageReaction_messageId_userId_key" ON "MessageReaction"("messageId", "userId");

CREATE INDEX "VideoCall_conversationId_createdAt_idx" ON "VideoCall"("conversationId", "createdAt");

ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VideoCall" ADD CONSTRAINT "VideoCall_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VideoCall" ADD CONSTRAINT "VideoCall_callerId_fkey" FOREIGN KEY ("callerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
